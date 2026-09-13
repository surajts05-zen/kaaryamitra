import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class MilestonesService {
  static async list(projectId: string) {
    return prisma.projectMilestone.findMany({
      where: { projectId },
      orderBy: { plannedEnd: 'asc' }
    });
  }

  static async getById(projectId: string, id: string) {
    const milestone = await prisma.projectMilestone.findFirst({
      where: { projectId, id }
    });
    if (!milestone) throw AppError.notFound('Milestone');
    return milestone;
  }

  static async create(projectId: string, data: any) {
    // Basic verification that project belongs to tenant should ideally be done in controller
    
    return prisma.projectMilestone.create({
      data: {
        ...data,
        projectId,
        plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
        plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : undefined,
      }
    });
  }

  static async update(projectId: string, id: string, data: any) {
    await this.getById(projectId, id);
    
    const updateData = { ...data };
    if (updateData.plannedStart) updateData.plannedStart = new Date(updateData.plannedStart);
    if (updateData.plannedEnd) updateData.plannedEnd = new Date(updateData.plannedEnd);

    // If completing
    if (updateData.status === 'COMPLETED' && !updateData.actualEnd) {
      updateData.actualEnd = new Date();
      updateData.completionPct = 100;
    }

    return prisma.projectMilestone.update({
      where: { id },
      data: updateData
    });
  }

  static async delete(projectId: string, id: string) {
    await this.getById(projectId, id);
    
    // Check constraints
    const expensesCount = await prisma.projectExpense.count({ where: { milestoneId: id } });
    if (expensesCount > 0) throw AppError.conflict('Cannot delete milestone that has expenses');

    return prisma.projectMilestone.delete({
      where: { id }
    });
  }
}
