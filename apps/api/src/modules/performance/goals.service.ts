import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class GoalsService {
  static async createGoal(tenantId: string, data: any) {
    return prisma.goal.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status,
        progress: data.progress || 0,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        parentGoalId: data.parentGoalId,
        employeeId: data.employeeId,
        departmentId: data.departmentId,
        companyWide: data.companyWide || false,
      },
    });
  }

  static async getGoals(tenantId: string, filters: any = {}) {
    const where: any = { tenantId };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.companyWide === 'true') where.companyWide = true;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    return prisma.goal.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, designation: { select: { name: true } } },
        },
        department: {
          select: { id: true, name: true },
        },
        childGoals: {
          select: {
            id: true,
            title: true,
            progress: true,
            status: true,
          }
        }
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  static async getGoalById(tenantId: string, id: string) {
    const goal = await prisma.goal.findUnique({
      where: { id, tenantId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        department: true,
        parentGoal: true,
        childGoals: true,
      },
    });

    if (!goal) throw AppError.notFound('Goal');
    return goal;
  }

  static async updateGoal(tenantId: string, id: string, data: any) {
    const goal = await this.getGoalById(tenantId, id);

    const updateData: any = {
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      progress: data.progress !== undefined ? parseInt(data.progress, 10) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      parentGoalId: data.parentGoalId,
    };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    return prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    });
  }

  static async deleteGoal(tenantId: string, id: string) {
    const goal = await this.getGoalById(tenantId, id);
    
    // check if it has children
    const childrenCount = await prisma.goal.count({ where: { parentGoalId: goal.id } });
    if (childrenCount > 0) {
      throw AppError.badRequest('Cannot delete a goal that has child goals (Key Results)');
    }

    await prisma.goal.delete({ where: { id: goal.id } });
    return true;
  }
}
