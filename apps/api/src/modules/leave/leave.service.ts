import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';
import { 
  CreateLeaveTypeSchema, 
  UpdateLeaveTypeSchema, 
  CreateLeaveApplicationSchema,
  ReviewLeaveApplicationSchema
} from './leave.schema.js';
import { AppError } from '../../lib/errors.js';
import { getTemplateByTrigger } from '../workflows/workflow.service.js';
import { createNotification } from '../notifications/notification.service.js';

export async function getLeaveTypes(tenantId: string) {
  return prisma.leaveType.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

export async function createLeaveType(tenantId: string, data: z.infer<typeof CreateLeaveTypeSchema>) {
  const existing = await prisma.leaveType.findFirst({
    where: { tenantId, code: data.code }
  });

  if (existing) {
    throw AppError.badRequest('Leave type with this code already exists');
  }

  return prisma.leaveType.create({
    data: {
      tenantId,
      name: data.name,
      code: data.code,
      color: data.color ?? null,
      isPaid: data.isPaid ?? true,
      description: data.description ?? null,
      daysPerYear: data.daysPerYear,
      accrualFrequency: data.accrualFrequency,
      isCarryForwardAllowed: data.isCarryForwardAllowed,
      maxCarryForward: data.maxCarryForward,
    }
  });
}

export async function updateLeaveType(tenantId: string, id: string, data: z.infer<typeof UpdateLeaveTypeSchema>) {
  const existing = await prisma.leaveType.findFirst({
    where: { id, tenantId }
  });

  if (!existing) {
    throw AppError.notFound('Leave type');
  }

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData['name'] = data.name;
  if (data.code !== undefined) updateData['code'] = data.code;
  if (data.color !== undefined) updateData['color'] = data.color ?? null;
  if (data.isPaid !== undefined) updateData['isPaid'] = data.isPaid;
  if (data.isActive !== undefined) updateData['isActive'] = data.isActive;
  if (data.description !== undefined) updateData['description'] = data.description ?? null;
  if (data.daysPerYear !== undefined) updateData['daysPerYear'] = data.daysPerYear;
  if (data.accrualFrequency !== undefined) updateData['accrualFrequency'] = data.accrualFrequency;
  if (data.isCarryForwardAllowed !== undefined) updateData['isCarryForwardAllowed'] = data.isCarryForwardAllowed;
  if (data.maxCarryForward !== undefined) updateData['maxCarryForward'] = data.maxCarryForward;

  return prisma.leaveType.update({
    where: { id },
    data: updateData
  });
}

export async function getMyLeaveBalances(tenantId: string, employeeId: string) {
  const currentYear = new Date().getFullYear();
  
  // Initialize balances if they don't exist for the current year
  const leaveTypes = await getLeaveTypes(tenantId);
  const activeLeaveTypes = leaveTypes.filter(lt => lt.isActive);
  
  const balances = [];
  
  for (const lt of activeLeaveTypes) {
    let balance = await prisma.leaveBalance.findUnique({
      where: {
        tenantId_employeeId_leaveTypeId_year: {
          tenantId,
          employeeId,
          leaveTypeId: lt.id,
          year: currentYear
        }
      },
      include: {
        leaveType: true
      }
    });
    
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          tenantId,
          employeeId,
          leaveTypeId: lt.id,
          year: currentYear,
          totalAccrued: lt.daysPerYear,
          used: 0,
          available: lt.daysPerYear
        },
        include: {
          leaveType: true
        }
      });
    }
    
    balances.push(balance);
  }

  return balances;
}

export async function getMyLeaveApplications(tenantId: string, employeeId: string) {
  return prisma.leaveApplication.findMany({
    where: { tenantId, employeeId },
    include: {
      leaveType: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function calculateDays(tenantId: string, startDate: Date, endDate: Date, isHalfDay: boolean): Promise<number> {
  if (isHalfDay) return 0.5;

  // Get company settings for working days
  const settings = await prisma.companySettings.findUnique({
    where: { tenantId }
  });
  // Default working days: Mon to Fri (1,2,3,4,5). 0 is Sun, 6 is Sat.
  const workingDays: number[] = settings?.workingDays ? (settings.workingDays as number[]) : [1, 2, 3, 4, 5];

  // Get holidays in this range
  const holidays = await prisma.holiday.findMany({
    where: {
      tenantId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const holidayDateStrings = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));

  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];

    // If it's a working day and not a holiday, count it
    if (workingDays.includes(dayOfWeek) && !holidayDateStrings.has(dateStr!)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export async function applyForLeave(tenantId: string, employeeId: string, data: z.infer<typeof CreateLeaveApplicationSchema>) {
  const currentYear = new Date().getFullYear();
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  
  if (start > end) {
    throw AppError.badRequest('Start date must be before or equal to end date');
  }

  const totalDays = await calculateDays(tenantId, start, end, data.isHalfDay);

  const balance = await prisma.leaveBalance.findUnique({
    where: {
      tenantId_employeeId_leaveTypeId_year: {
        tenantId,
        employeeId,
        leaveTypeId: data.leaveTypeId,
        year: currentYear
      }
    }
  });

  if (!balance) {
    throw AppError.badRequest('Leave balance not initialized');
  }

  if (balance.available < totalDays) {
    throw AppError.badRequest('Insufficient leave balance');
  }

  const application = await prisma.$transaction(async (tx) => {
    const application = await tx.leaveApplication.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        isHalfDay: data.isHalfDay,
        halfDayPeriod: data.halfDayPeriod ?? null,
        totalDays,
        reason: data.reason ?? null,
        status: 'PENDING'
      },
      include: { leaveType: true }
    });

    await tx.leaveBalance.update({
      where: { id: balance.id },
      data: {
        available: balance.available - totalDays
      }
    });

    // Start a workflow instance if a LEAVE_REQUEST template is configured
    const template = await getTemplateByTrigger(tenantId, 'LEAVE_REQUEST');
    if (template && template.isActive) {
      await tx.workflowInstance.create({
        data: {
          tenantId,
          templateId: template.id,
          entityType: 'LeaveApplication',
          entityId: application.id,
          status: 'IN_PROGRESS',
          currentStepIndex: 0,
          leaveApplicationId: application.id,
        },
      });
    }

    return application;
  });

  // Notify the manager (reporting manager) — fire-and-forget after transaction
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { manager: { include: { user: true } } },
  });

  if (employee?.manager?.user?.id) {
    const empName = `${employee.firstName} ${employee.lastName}`;
    const leaveName = application.leaveType?.name ?? 'Leave';
    createNotification({
      tenantId,
      userId: employee.manager.user.id,
      type: 'leave.applied',
      title: `New Leave Request from ${empName}`,
      body: `${empName} has applied for ${application.totalDays} day(s) of ${leaveName}.`,
      link: `/t/${(await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug}/approvals`,
      email: employee.manager.user.email,
    }).catch(() => {});
  }

  return application;
}

export async function getPendingApprovals(tenantId: string, managerEmployeeId: string) {
  const reportees = await prisma.employee.findMany({
    where: { managerId: managerEmployeeId, tenantId },
    select: { id: true }
  });

  const reporteeIds = reportees.map(r => r.id);

  if (reporteeIds.length === 0) return [];

  return prisma.leaveApplication.findMany({
    where: {
      tenantId,
      employeeId: { in: reporteeIds },
      status: 'PENDING'
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          avatarUrl: true
        }
      },
      leaveType: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function reviewLeaveApplication(tenantId: string, managerEmployeeId: string, applicationId: string, data: z.infer<typeof ReviewLeaveApplicationSchema>) {
  const application = await prisma.leaveApplication.findFirst({
    where: { id: applicationId, tenantId },
    include: { employee: true }
  });

  if (!application) {
    throw AppError.notFound('Leave application');
  }

  if (application.employee.managerId !== managerEmployeeId) {
    throw AppError.forbidden('You are not authorized to review this application');
  }

  if (application.status !== 'PENDING') {
    throw AppError.badRequest(`Application is already ${application.status}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.leaveApplication.update({
      where: { id: applicationId },
      data: {
        status: data.status,
        managerNote: data.managerNote ?? null
      }
    });

    if (data.status === 'REJECTED') {
      const currentYear = new Date(application.startDate).getFullYear();
      const balance = await tx.leaveBalance.findUnique({
        where: {
          tenantId_employeeId_leaveTypeId_year: {
            tenantId,
            employeeId: application.employeeId,
            leaveTypeId: application.leaveTypeId,
            year: currentYear
          }
        }
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            available: balance.available + application.totalDays
          }
        });
      }
    } else if (data.status === 'APPROVED') {
      const currentYear = new Date(application.startDate).getFullYear();
      const balance = await tx.leaveBalance.findUnique({
        where: {
          tenantId_employeeId_leaveTypeId_year: {
            tenantId,
            employeeId: application.employeeId,
            leaveTypeId: application.leaveTypeId,
            year: currentYear
          }
        }
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: balance.used + application.totalDays
          }
        });
      }
    }

    return updated;
  });

  // Notify the employee — fire-and-forget after transaction
  const employee = await prisma.employee.findUnique({
    where: { id: application.employeeId },
    include: { user: true },
  });

  if (employee?.user?.id) {
    const isApproved = data.status === 'APPROVED';
    const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;
    createNotification({
      tenantId,
      userId: employee.user.id,
      type: isApproved ? 'leave.approved' : 'leave.rejected',
      title: isApproved ? 'Your Leave has been Approved ✅' : 'Your Leave has been Rejected ❌',
      body: isApproved
        ? `Your leave request has been approved${data.managerNote ? `: "${data.managerNote}"` : '.'}`
        : `Your leave request was rejected${data.managerNote ? `: "${data.managerNote}"` : '.'}`,
      link: tenantSlug ? `/t/${tenantSlug}/me/leave` : undefined,
      email: employee.user.email,
    }).catch(() => {});
  }

  return updated;
}
