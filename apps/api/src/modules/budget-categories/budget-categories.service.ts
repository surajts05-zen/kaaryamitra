import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class BudgetCategoriesService {
  static async list(tenantId: string) {
    return prisma.budgetCategory.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
      include: {
        parent: { select: { id: true, name: true, code: true } },
      }
    });
  }

  static async getById(tenantId: string, id: string) {
    const category = await prisma.budgetCategory.findFirst({
      where: { tenantId, id },
      include: {
        parent: { select: { id: true, name: true, code: true } },
      }
    });
    if (!category) throw AppError.notFound('Budget Category');
    return category;
  }

  static async create(tenantId: string, data: any) {
    const existing = await prisma.budgetCategory.findFirst({
      where: { tenantId, code: data.code }
    });
    if (existing) throw AppError.conflict('Budget category code already exists');

    return prisma.budgetCategory.create({
      data: { ...data, tenantId }
    });
  }

  static async bulkCreate(tenantId: string, items: any[]) {
    const data = items.map(item => ({ ...item, tenantId }));
    return prisma.budgetCategory.createMany({
      data,
      skipDuplicates: true
    });
  }

  static async update(tenantId: string, id: string, data: any) {
    await this.getById(tenantId, id); // Ensure it exists
    
    if (data.code) {
      const existing = await prisma.budgetCategory.findFirst({
        where: { tenantId, code: data.code, id: { not: id } }
      });
      if (existing) throw AppError.conflict('Budget category code already exists');
    }

    return prisma.budgetCategory.update({
      where: { id },
      data
    });
  }

  static async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    
    // Constraints
    const linesCount = await prisma.budgetRequestLineItem.count({ where: { categoryId: id } });
    if (linesCount > 0) throw AppError.conflict('Cannot delete category used in budget requests');

    return prisma.budgetCategory.delete({
      where: { id }
    });
  }
}
