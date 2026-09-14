import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { startWorkflow } from '../workflows/workflow.service.js';

export class BudgetRequestsService {
  static async list(tenantId: string) {
    return prisma.budgetRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        costCenter: { select: { name: true } },
        project: { select: { name: true, code: true } },
        period: { select: { name: true } },
      }
    });
  }

  static async getById(tenantId: string, id: string) {
    const req = await prisma.budgetRequest.findFirst({
      where: { tenantId, id },
      include: {
        costCenter: true,
        project: true,
        period: true,
        lineItems: { include: { category: true } },
        workflowInstance: {
          include: { actions: true, template: true }
        }
      }
    });
    if (!req) throw AppError.notFound('Budget Request');
    return req;
  }

  static async create(tenantId: string, requesterId: string, data: any) {
    const { lineItems, ...rest } = data;

    const sanitizeFk = (id?: string) => (!id || id === 'NONE' || id.trim() === '' ? null : id);

    // Generate request number
    const count = await prisma.budgetRequest.count({ where: { tenantId } });
    const requestNumber = `BR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate total
    const requestedAmount = lineItems.reduce((acc: number, item: any) => {
      return acc + (item.quantity * item.unitCost);
    }, 0);

    return prisma.$transaction(async (tx) => {
      const br = await tx.budgetRequest.create({
        data: {
          ...rest,
          projectId: sanitizeFk(rest.projectId),
          costCenterId: sanitizeFk(rest.costCenterId),
          departmentId: sanitizeFk(rest.departmentId),
          periodId: sanitizeFk(rest.periodId),
          tenantId,
          requesterId,
          requestNumber,
          requestedAmount,
          status: 'DRAFT',
          lineItems: {
            create: lineItems.map((li: any) => ({
              ...li,
              categoryId: sanitizeFk(li.categoryId),
              requestedAmount: li.quantity * li.unitCost
            }))
          }
        },
        include: { lineItems: true }
      });
      return br;
    });
  }

  static async update(tenantId: string, id: string, data: any) {
    const existing = await this.getById(tenantId, id);
    if (existing.status !== 'DRAFT') {
      throw AppError.badRequest('Can only edit draft budget requests');
    }

    const { lineItems, ...rest } = data;
    const sanitizeFk = (id?: string) => (id === undefined ? undefined : (!id || id === 'NONE' || id.trim() === '' ? null : id));
    
    return prisma.$transaction(async (tx) => {
      if (rest.projectId !== undefined) rest.projectId = sanitizeFk(rest.projectId);
      if (rest.costCenterId !== undefined) rest.costCenterId = sanitizeFk(rest.costCenterId);
      if (rest.departmentId !== undefined) rest.departmentId = sanitizeFk(rest.departmentId);
      if (rest.periodId !== undefined) rest.periodId = sanitizeFk(rest.periodId);

      if (lineItems) {
        await tx.budgetRequestLineItem.deleteMany({ where: { budgetRequestId: id } });
        await tx.budgetRequestLineItem.createMany({
          data: lineItems.map((li: any) => ({
            ...li,
            categoryId: sanitizeFk(li.categoryId),
            budgetRequestId: id,
            requestedAmount: li.quantity * li.unitCost
          }))
        });
        
        rest.requestedAmount = lineItems.reduce((acc: number, item: any) => {
          return acc + (item.quantity * item.unitCost);
        }, 0);
      }

      return tx.budgetRequest.update({
        where: { id },
        data: rest,
        include: { lineItems: true }
      });
    });
  }

  static async submit(tenantId: string, id: string, userId: string) {
    const req = await this.getById(tenantId, id);
    if (req.status !== 'DRAFT') throw AppError.badRequest('Can only submit DRAFT requests');

    await prisma.$transaction(async (tx) => {
      await tx.budgetRequest.update({
        where: { id },
        data: { status: 'SUBMITTED' }
      });
      
      // Start workflow — if no BUDGET_REQUEST workflow template is configured this is a no-op
      await startWorkflow(tenantId, 'BUDGET_REQUEST', 'BudgetRequest', id);
    });

    return this.getById(tenantId, id);
  }

  static async recall(tenantId: string, id: string) {
    const req = await this.getById(tenantId, id);
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(req.status)) {
      throw AppError.badRequest('Can only recall requests that are pending approval');
    }

    return prisma.$transaction(async (tx) => {
      if (req.workflowInstance && req.workflowInstance.status === 'IN_PROGRESS') {
        await tx.workflowInstance.update({
          where: { id: req.workflowInstance.id },
          data: { status: 'CANCELLED', completedAt: new Date() }
        });
      }

      return tx.budgetRequest.update({
        where: { id },
        data: { status: 'DRAFT' }
      });
    });
  }

  static async returnForRevision(tenantId: string, id: string, actorUserId: string, comment?: string) {
    const req = await this.getById(tenantId, id);
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(req.status)) {
      throw AppError.badRequest('Can only return requests that are pending approval');
    }

    return prisma.$transaction(async (tx) => {
      if (req.workflowInstance && req.workflowInstance.status === 'IN_PROGRESS') {
        await tx.workflowAction.create({
          data: {
            instanceId: req.workflowInstance.id,
            stepIndex: req.workflowInstance.currentStepIndex,
            actorId: actorUserId,
            action: 'returned',
            comment: comment ?? null
          }
        });

        await tx.workflowInstance.update({
          where: { id: req.workflowInstance.id },
          data: { status: 'CANCELLED', completedAt: new Date() }
        });
      }

      return tx.budgetRequest.update({
        where: { id },
        data: { status: 'DRAFT' }
      });
    });
  }

  static async archive(tenantId: string, id: string) {
    const req = await this.getById(tenantId, id);
    if (!['APPROVED', 'REJECTED', 'CLOSED'].includes(req.status)) {
      throw AppError.badRequest('Can only archive completed requests');
    }

    return prisma.budgetRequest.update({
      where: { id },
      data: { isArchived: true }
    });
  }
}
