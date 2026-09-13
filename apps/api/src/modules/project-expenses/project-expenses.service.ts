import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class ProjectExpensesService {
  static async list(tenantId: string, filters: any = {}) {
    const where: any = { tenantId };
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;
    
    return prisma.projectExpense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        project: { select: { name: true, code: true } },
        milestone: { select: { name: true } },
      }
    });
  }

  static async getById(tenantId: string, id: string) {
    const expense = await prisma.projectExpense.findFirst({
      where: { tenantId, id },
      include: {
        project: true,
        milestone: true,
      }
    });
    if (!expense) throw AppError.notFound('Project Expense');
    return expense;
  }

  static async submit(tenantId: string, employeeId: string, data: any) {
    // Validate project
    const project = await prisma.project.findFirst({ where: { id: data.projectId, tenantId } });
    if (!project) throw AppError.notFound('Project not found');
    
    return prisma.projectExpense.create({
      data: {
        ...data,
        tenantId,
        employeeId,
        date: new Date(data.date),
        status: 'PENDING'
      }
    });
  }

  static async approve(tenantId: string, id: string, approverId: string) {
    const expense = await this.getById(tenantId, id);
    if (expense.status !== 'PENDING') throw AppError.badRequest('Expense is not in PENDING state');
    
    // Process approval logic in transaction:
    // 1. Update expense status
    // 2. Create BudgetTransaction (EXPENSE)
    // 3. Update Project actualCost
    return prisma.$transaction(async (tx) => {
      const updated = await tx.projectExpense.update({
        where: { id },
        data: { status: 'APPROVED' }
      });
      
      await tx.budgetTransaction.create({
        data: {
          tenantId,
          projectId: expense.projectId,
          type: 'EXPENSE',
          amount: expense.amount,
          currency: expense.currency,
          referenceType: 'EXPENSE',
          referenceId: id,
          description: expense.description || 'Project Expense',
          createdBy: approverId
        }
      });
      
      await tx.project.update({
        where: { id: expense.projectId },
        data: {
          actualCost: { increment: expense.amount }
        }
      });
      
      return updated;
    });
  }

  static async reject(tenantId: string, id: string) {
    const expense = await this.getById(tenantId, id);
    if (expense.status !== 'PENDING') throw AppError.badRequest('Expense is not in PENDING state');
    
    return prisma.projectExpense.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
  }
}
