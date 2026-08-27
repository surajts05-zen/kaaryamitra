import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';
import { 
  CreateLeaveTypeSchema, 
  UpdateLeaveTypeSchema, 
  CreateLeaveApplicationSchema,
  ReviewLeaveApplicationSchema
} from './leave.schema.js';
import { AppError } from '../../lib/errors.js';

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

function calculateDays(startDate: Date, endDate: Date, isHalfDay: boolean): number {
  if (isHalfDay) return 0.5;
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  return diffDays;
}

export async function applyForLeave(tenantId: string, employeeId: string, data: z.infer<typeof CreateLeaveApplicationSchema>) {
  const currentYear = new Date().getFullYear();
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  
  if (start > end) {
    throw AppError.badRequest('Start date must be before or equal to end date');
  }

  const totalDays = calculateDays(start, end, data.isHalfDay);

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

  return prisma.$transaction(async (tx) => {
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
      }
    });

    await tx.leaveBalance.update({
      where: { id: balance.id },
      data: {
        available: balance.available - totalDays
      }
    });

    return application;
  });
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

  return prisma.$transaction(async (tx) => {
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
}
