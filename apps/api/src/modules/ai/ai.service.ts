import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from '../../lib/prisma.js';

const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] || '' });

// ─── Tools Definition ─────────────────────────────────────────────────────────

const getEmployeesTool = {
  name: 'getEmployees',
  description: 'Search for employees in the company by department, name, or role.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Optional search query for name or email' },
      departmentName: { type: Type.STRING, description: 'Optional department name to filter by' }
    }
  }
};

const getLeaveBalanceTool = {
  name: 'getLeaveBalance',
  description: 'Get the leave balance for a specific employee.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      employeeName: { type: Type.STRING, description: 'Name of the employee' }
    },
    required: ['employeeName']
  }
};

const getWhoIsOnLeaveTool = {
  name: 'getWhoIsOnLeave',
  description: 'Find out who is currently on leave or will be on leave soon.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: 'Optional date in YYYY-MM-DD format. Defaults to today.' }
    }
  }
};

const applyForLeaveTool = {
  name: 'applyForLeave',
  description: 'Apply for leave on behalf of the current user. Requires start date, end date, leave type code, and reason.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      startDate: { type: Type.STRING, description: 'Start date in YYYY-MM-DD format' },
      endDate: { type: Type.STRING, description: 'End date in YYYY-MM-DD format' },
      leaveTypeCode: { type: Type.STRING, description: 'Code for leave type (e.g., CASUAL, SICK, EARNED)' },
      reason: { type: Type.STRING, description: 'Reason for the leave' }
    },
    required: ['startDate', 'endDate', 'leaveTypeCode', 'reason']
  }
};

const tools = [
  { getEmployeesTool },
  { getLeaveBalanceTool },
  { getWhoIsOnLeaveTool },
  { applyForLeaveTool }
];

// ─── Tool Executors ───────────────────────────────────────────────────────────

async function executeGetEmployees(tenantId: string, args: any) {
  const { query, departmentName } = args;
  const where: any = { tenantId };
  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { workEmail: { contains: query, mode: 'insensitive' } }
    ];
  }
  if (departmentName) {
    where.department = { name: { contains: departmentName, mode: 'insensitive' } };
  }
  const employees = await prisma.employee.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, workEmail: true, department: { select: { name: true } }, designation: { select: { name: true } } },
    take: 20
  });
  return employees;
}

async function executeGetLeaveBalance(tenantId: string, args: any) {
  const { employeeName } = args;
  const employee = await prisma.employee.findFirst({
    where: { 
      tenantId, 
      OR: [
        { firstName: { contains: employeeName, mode: 'insensitive' } },
        { lastName: { contains: employeeName, mode: 'insensitive' } }
      ]
    }
  });
  if (!employee) return { error: `Employee ${employeeName} not found.` };
  
  const balances = await prisma.leaveBalance.findMany({
    where: { tenantId, employeeId: employee.id, year: new Date().getFullYear() },
    include: { leaveType: { select: { name: true, code: true } } }
  });
  return balances.map(b => ({
    leaveType: b.leaveType.name,
    code: b.leaveType.code,
    totalAccrued: b.totalAccrued,
    used: b.used,
    available: b.available
  }));
}

async function executeGetWhoIsOnLeave(tenantId: string, args: any) {
  const dateStr = args.date || new Date().toISOString().split('T')[0];
  const date = new Date(dateStr);
  const onLeave = await prisma.leaveApplication.findMany({
    where: {
      tenantId,
      status: 'APPROVED',
      startDate: { lte: date },
      endDate: { gte: date }
    },
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
      leaveType: { select: { name: true } }
    }
  });
  return onLeave.map(l => ({
    employee: `${l.employee.firstName} ${l.employee.lastName}`,
    department: l.employee.department?.name,
    leaveType: l.leaveType.name,
    startDate: l.startDate,
    endDate: l.endDate
  }));
}

async function executeApplyForLeave(tenantId: string, userId: string, args: any) {
  const { startDate, endDate, leaveTypeCode, reason } = args;
  
  const employee = await prisma.employee.findUnique({
    where: { userId }
  });
  if (!employee) return { error: 'Current user has no linked employee profile.' };
  
  const leaveType = await prisma.leaveType.findUnique({
    where: { tenantId_code: { tenantId, code: leaveTypeCode } }
  });
  if (!leaveType) return { error: `Leave type ${leaveTypeCode} not found.` };

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const application = await prisma.leaveApplication.create({
    data: {
      tenantId,
      employeeId: employee.id,
      leaveTypeId: leaveType.id,
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      reason,
      status: 'PENDING'
    }
  });
  
  return { success: true, message: 'Leave application submitted successfully.', applicationId: application.id };
}

// ─── Chat Orchestration ───────────────────────────────────────────────────────

export async function handleAiChat(tenantId: string, userId: string, userMessage: string, history: any[] = []) {
  if (!process.env['GEMINI_API_KEY']) {
    return "AI is currently unavailable. Please configure the GEMINI_API_KEY environment variable.";
  }

  // Convert history to genai format
  let chatHistory: any[] = history.map(h => ({
    role: h.role,
    parts: h.parts.map((p: any) => ({ text: p.text }))
  }));

  const systemInstruction = "You are a helpful HR assistant for KaaryaMitra. You can answer questions about employees, leave balances, and who is on leave, and even help the user apply for leave. Always format your responses in clear markdown.";

  try {
    let chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [getEmployeesTool, getLeaveBalanceTool, getWhoIsOnLeaveTool, applyForLeaveTool] }]
      }
    });

    // Manually set history if supported, or just send the message
    // Actually in `@google/genai`, chat.sendMessage({ message }) takes a string or array of parts.
    // Let's pass the raw userMessage. If we want history, we can pass it in create options if allowed,
    // or just let the caller maintain it. For now, since we created a new chat, we can just send the whole conversation as one message or configure history.
    let response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [getEmployeesTool, getLeaveBalanceTool, getWhoIsOnLeaveTool, applyForLeaveTool] }]
      }
    });
    
    // Check for function calls
    while (response.functionCalls && response.functionCalls.length > 0) {
      const calls = response.functionCalls;
      const functionResponses = [];
      
      for (const call of calls) {
        let result: any = null;
        try {
          const args = call.args || {};
          switch (call.name) {
            case 'getEmployees':
              result = await executeGetEmployees(tenantId, args);
              break;
            case 'getLeaveBalance':
              result = await executeGetLeaveBalance(tenantId, args);
              break;
            case 'getWhoIsOnLeave':
              result = await executeGetWhoIsOnLeave(tenantId, args);
              break;
            case 'applyForLeave':
              result = await executeApplyForLeave(tenantId, userId, args);
              break;
            default:
              result = { error: 'Unknown tool' };
          }
        } catch (e: any) {
          result = { error: e.message };
        }
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: result
          }
        });
      }
      
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...chatHistory, 
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: response.functionCalls.map(c => ({ functionCall: c })) },
          { role: 'user', parts: functionResponses }
        ],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [getEmployeesTool, getLeaveBalanceTool, getWhoIsOnLeaveTool, applyForLeaveTool] }]
        }
      });
    }

    return response.text;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return "I encountered an error while processing your request. Please try again later.";
  }
}
