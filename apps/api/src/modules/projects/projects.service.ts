import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class ProjectsService {
  static async list(tenantId: string) {
    const projects = await prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        costCenter: { select: { name: true } },
        milestones: { select: { actualCost: true } },
        budgetRequests: { where: { status: 'APPROVED' }, select: { requestedAmount: true } }
      }
    });

    return projects.map(p => {
      const baseApproved = Number(p.approvedBudget || 0);
      const approvedRequestsSum = p.budgetRequests?.reduce((sum, req) => sum + Number(req.requestedAmount || 0), 0) || 0;
      const approvedBudget = Math.max(baseApproved, approvedRequestsSum);
      const milestonesActual = p.milestones?.reduce((sum, m) => sum + Number(m.actualCost || 0), 0) || 0;
      const actualCost = Number(p.actualCost || 0) + milestonesActual;
      const availableBudget = Math.max(0, approvedBudget - actualCost);

      return {
        ...p,
        approvedBudget,
        actualCost,
        availableBudget
      };
    });
  }

  static async getById(tenantId: string, id: string) {
    const project = await prisma.project.findFirst({
      where: { tenantId, id },
      include: {
        costCenter: true,
        members: true,
        milestones: true,
        allocations: {
          include: { category: true }
        },
        budgetRequests: {
          where: { status: 'APPROVED' }
        }
      }
    });
    
    if (!project) throw AppError.notFound('Project');

    const baseApproved = Number(project.approvedBudget || 0);
    const approvedRequestsSum = project.budgetRequests?.reduce((sum, req) => sum + Number(req.requestedAmount || 0), 0) || 0;
    const approvedBudget = Math.max(baseApproved, approvedRequestsSum);

    const milestonesActual = project.milestones?.reduce((sum, m) => sum + Number(m.actualCost || 0), 0) || 0;
    const actualCost = Number(project.actualCost || 0) + milestonesActual;

    const availableBudget = Math.max(0, approvedBudget - actualCost);

    return {
      ...project,
      approvedBudget,
      actualCost,
      availableBudget
    };
  }

  static async create(tenantId: string, data: any) {
    const existing = await prisma.project.findFirst({
      where: { tenantId, code: data.code }
    });
    if (existing) throw AppError.conflict('Project code already exists');

    const approvedBudget = Number(data.approvedBudget || 0);
    const actualCost = Number(data.actualCost || 0);
    const availableBudget = Number(data.availableBudget) || Math.max(0, approvedBudget - actualCost);

    return prisma.project.create({
      data: {
        ...data,
        tenantId,
        approvedBudget,
        actualCost,
        availableBudget,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : undefined,
      }
    });
  }

  static async bulkCreate(tenantId: string, items: any[]) {
    const data = items.map(item => {
      const approvedBudget = Number(item.approvedBudget || 0);
      const actualCost = Number(item.actualCost || 0);
      const availableBudget = Number(item.availableBudget) || Math.max(0, approvedBudget - actualCost);
      return {
        ...item,
        tenantId,
        approvedBudget,
        actualCost,
        availableBudget,
        startDate: item.startDate ? new Date(item.startDate) : undefined,
        plannedEndDate: item.plannedEndDate ? new Date(item.plannedEndDate) : undefined,
      };
    });
    return prisma.project.createMany({
      data,
      skipDuplicates: true
    });
  }

  static async update(tenantId: string, id: string, data: any) {
    await this.getById(tenantId, id);
    
    if (data.code) {
      const existing = await prisma.project.findFirst({
        where: { tenantId, code: data.code, id: { not: id } }
      });
      if (existing) throw AppError.conflict('Project code already exists');
    }

    const updateData = { ...data };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.plannedEndDate) updateData.plannedEndDate = new Date(updateData.plannedEndDate);

    return prisma.project.update({
      where: { id },
      data: updateData
    });
  }
  
  // Members
  
  static async addMember(tenantId: string, projectId: string, data: any) {
    await this.getById(tenantId, projectId);
    
    return prisma.projectMember.create({
      data: {
        projectId,
        employeeId: data.employeeId,
        role: data.role,
        allocationPct: data.allocationPct,
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
        billingRate: data.billingRate
      }
    });
  }
  
  static async removeMember(tenantId: string, projectId: string, memberId: string) {
    await this.getById(tenantId, projectId);
    return prisma.projectMember.delete({
      where: { id: memberId }
    });
  }
}
