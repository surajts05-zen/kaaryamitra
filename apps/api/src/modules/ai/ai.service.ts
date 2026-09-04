import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from '../../lib/prisma.js';

export async function getAiClient(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  
  let dbSettings: any = null;
  try {
    dbSettings = await (prisma as any).platformSettings.findUnique({ where: { id: 'global' } });
  } catch (err) {
    // fallback gracefully
  }

  // @ts-ignore - geminiApiKey added to schema but client may not be fully regenerated yet
  const apiKey = tenant?.geminiApiKey || dbSettings?.geminiApiKey || process.env['GEMINI_API_KEY'];
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

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
  const ai = await getAiClient(tenantId);
  if (!ai) {
    return "AI is currently unavailable. Please configure the Gemini API Key in Tenant Settings or environment variables.";
  }

  // Convert history to genai format
  let chatHistory: any[] = history.map(h => ({
    role: h.role,
    parts: h.parts.map((p: any) => ({ text: p.text }))
  }));

  const systemInstruction = "You are KaaryaMitra Assistant, an intelligent AI helper for KaaryaMitra HRMS. You can answer questions about employees, leave balances, who is on leave, policies, and assist users with applying for leave or managing HR tasks. Always format your responses in clear markdown.";

  try {
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

export async function generateInsights(tenantId: string) {
  const ai = await getAiClient(tenantId);
  if (!ai) return null;

  // Import dynamically or get stats directly
  const { DashboardService } = await import('../dashboard/dashboard.service.js');
  const stats = await DashboardService.getDashboardStats(tenantId);

  const prompt = `
You are an expert HR Analyst. Based on the following raw dashboard data for our company, write a concise, professional "Executive HR Summary" (2-3 short paragraphs).
Highlight any interesting patterns, such as upcoming holidays, recent activity, or headcount. Keep the tone encouraging but professional.

Data:
- Headcount: ${stats.headcount} employees
- Departments: ${stats.departments}
- Locations: ${stats.locations}
- Open Roles (Designations): ${stats.openRoles}
- Upcoming Holidays: ${stats.upcomingHolidays.map(h => h.name).join(', ') || 'None'}
- Recent Activity: ${stats.recentActivity.map(a => a.action).join(', ') || 'None'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error('Gemini Insights Error:', error);
    return null;
  }
}

export async function extractDocumentData(tenantId: string, fileBuffer: Buffer, mimeType: string, prompt: string) {
  const ai = await getAiClient(tenantId);
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt + " \n\nIMPORTANT: Return ONLY valid JSON. Do not include markdown formatting like ```json" },
            {
              inlineData: {
                data: fileBuffer.toString("base64"),
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    try {
      const text = response.text || "{}";
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON output", e, response.text);
      return null;
    }
  } catch (error) {
    console.error('Gemini Extract Error:', error);
    return null;
  }
}

export async function generatePolicyBlocks(tenantId: string, userPrompt: string) {
  const ai = await getAiClient(tenantId);
  if (!ai) return null;

  const systemInstruction = `You are an expert HR Policy drafter. 
Generate structured blocks for a company policy based on the user's prompt. 
Each block MUST be an object with one of these schema types:
1. Heading block: { "id": "b1", "type": "heading", "level": 1, "content": "Title text" }
2. Paragraph block: { "id": "b2", "type": "paragraph", "content": "Detailed text content..." }
3. Callout/Alert block: { "id": "b3", "type": "alert", "alertType": "info", "content": "Important note or highlight" }
4. List block: { "id": "b4", "type": "list", "items": ["Item 1", "Item 2"] }
5. FAQ block: { "id": "b5", "type": "faq", "items": [{ "question": "Q?", "answer": "A." }] }

Return a JSON object containing:
{
  "title": "Suggested Policy Title",
  "description": "Short 1-sentence policy summary",
  "blocks": [ ... array of block objects ...]
}
IMPORTANT: Return ONLY raw valid JSON. Do not include markdown code block formatting like \`\`\`json.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Gemini generatePolicyBlocks Error:', error);
    return null;
  }
}


