import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class BudgetAllocationsService {
  static async list(projectId: string) {
    return prisma.budgetAllocation.findMany({
      where: { projectId },
      include: {
        category: { select: { name: true } },
        milestone: { select: { name: true } }
      }
    });
  }

  static async create(projectId: string, data: any) {
    // Basic verification that project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw AppError.notFound('Project');
    
    // In a real scenario, check if allocation exceeds available budget
    // For MVP, just create it
    
    return prisma.budgetAllocation.create({
      data: {
        ...data,
        projectId
      }
    });
  }

  static async delete(projectId: string, id: string) {
    const allocation = await prisma.budgetAllocation.findFirst({
      where: { projectId, id }
    });
    if (!allocation) throw AppError.notFound('Allocation');

    return prisma.budgetAllocation.delete({
      where: { id }
    });
  }
}
