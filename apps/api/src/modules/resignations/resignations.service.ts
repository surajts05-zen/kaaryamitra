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
    const resignation = await prisma.resignation.update({
      where: { id, tenantId },
      data: {
        status: data.status,
        ...(data.approvedLastWorkingDay !== undefined && { approvedLastWorkingDay: data.approvedLastWorkingDay ? new Date(data.approvedLastWorkingDay) : null }),
        ...(data.noticePeriodDays !== undefined && { noticePeriodDays: data.noticePeriodDays ? parseInt(data.noticePeriodDays, 10) : null }),
        ...(data.exitInterviewNotes !== undefined && { exitInterviewNotes: data.exitInterviewNotes ?? null }),
      }
    });

    if (data.status === 'APPROVED') {
      try {
        const offboardingTemplates = await prisma.checklistTemplate.findMany({
          where: { tenantId, type: 'OFFBOARDING' },
          include: { tasks: true },
        });
        for (const template of offboardingTemplates) {
          await prisma.employeeChecklist.create({
            data: {
              tenantId,
              employeeId: resignation.employeeId,
              type: template.type,
              tasks: {
                create: template.tasks.map((t) => ({
                  title: t.title,
                  description: t.description,
                  assigneeRole: t.assigneeRole,
                })),
              },
            },
          });
        }
      } catch (err) {
        console.error(`Failed to auto-assign offboarding checklists for resignation ${id}:`, err);
      }

      // Trigger offboarding workflow if one exists
      try {
        const { startWorkflow } = await import('../workflows/workflow.service.js');
        await startWorkflow(tenantId, 'OFFBOARDING_REQUEST', 'Employee', resignation.employeeId);
      } catch (err) {
        console.error(`Failed to start offboarding workflow for resignation ${id}:`, err);
      }
    }

    return resignation;
  }

  static async updateClearance(tenantId: string, id: string, isClearanceCompleted: boolean) {
    if (isClearanceCompleted) {
      const resignation = await prisma.resignation.findUnique({ where: { id, tenantId } });
      if (!resignation) throw AppError.notFound('Resignation');

      // Check for unreturned assets
      const unreturnedAssets = await prisma.asset.count({
        where: { tenantId, assignedToId: resignation.employeeId, status: 'ASSIGNED' }
      });
      if (unreturnedAssets > 0) {
        throw AppError.badRequest(`Cannot complete clearance. Employee has ${unreturnedAssets} unreturned asset(s).`);
      }
    }

    return prisma.resignation.update({
      where: { id, tenantId },
      data: { isClearanceCompleted }
    });
  }
}
