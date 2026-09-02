import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { ResignationStatus } from '@prisma/client';

export class ResignationsService {
  static async submitResignation(tenantId: string, employeeId: string, data: any) {
    // Check if already submitted
    const existing = await prisma.resignation.findFirst({
      where: {
        tenantId,
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existing) {
      throw AppError.badRequest('A resignation request is already active.');
    }

    return prisma.resignation.create({
      data: {
        tenantId,
        employeeId,
        reason: data.reason,
        requestedLastWorkingDay: new Date(data.requestedLastWorkingDay),
        status: 'PENDING',
      }
    });
  }

  static async getMyResignation(tenantId: string, employeeId: string) {
    return prisma.resignation.findFirst({
      where: { tenantId, employeeId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  static async listResignations(tenantId: string) {
    return prisma.resignation.findMany({
      where: { tenantId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } }
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  static async updateResignationStatus(tenantId: string, id: string, data: any) {
    return prisma.resignation.update({
      where: { id, tenantId },
      data: {
        status: data.status,
        ...(data.approvedLastWorkingDay !== undefined && { approvedLastWorkingDay: data.approvedLastWorkingDay ? new Date(data.approvedLastWorkingDay) : null }),
        ...(data.noticePeriodDays !== undefined && { noticePeriodDays: data.noticePeriodDays ? parseInt(data.noticePeriodDays, 10) : null }),
        ...(data.exitInterviewNotes !== undefined && { exitInterviewNotes: data.exitInterviewNotes ?? null }),
      }
    });
  }

  static async updateClearance(tenantId: string, id: string, isClearanceCompleted: boolean) {
    return prisma.resignation.update({
      where: { id, tenantId },
      data: { isClearanceCompleted }
    });
  }
}
