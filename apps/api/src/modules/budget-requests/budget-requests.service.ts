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
          tenantId,
          requesterId,
          requestNumber,
          requestedAmount,
          status: 'DRAFT',
          lineItems: {
            create: lineItems.map((li: any) => ({
              ...li,
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
    
    return prisma.$transaction(async (tx) => {
      if (lineItems) {
        await tx.budgetRequestLineItem.deleteMany({ where: { budgetRequestId: id } });
        await tx.budgetRequestLineItem.createMany({
          data: lineItems.map((li: any) => ({
            ...li,
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

    // Start workflow
    const template = await prisma.workflowTemplate.findFirst({
      where: { tenantId, triggerType: 'BUDGET_REQUEST', isActive: true },
    });

    if (!template) {
      throw AppError.badRequest('No active workflow template for BUDGET_REQUEST found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.budgetRequest.update({
        where: { id },
        data: { status: 'SUBMITTED' }
      });
      
      await startWorkflow(tenantId, template.id, 'BudgetRequest', id);
    });

    return this.getById(tenantId, id);
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
