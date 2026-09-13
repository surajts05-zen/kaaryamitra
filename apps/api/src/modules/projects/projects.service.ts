import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class ProjectsService {
  static async list(tenantId: string) {
    return prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        costCenter: { select: { name: true } },
      }
    });
  }

  static async getById(tenantId: string, id: string) {
    const project = await prisma.project.findFirst({
      where: { tenantId, id },
      include: {
        costCenter: true,
        members: {
          include: {
            project: false // prevent circular
          }
        },
        milestones: true,
        allocations: {
          include: { category: true }
        }
      }
    });
    
    // Quick hack for member employee details since relation isn't direct in schema
    // In a real app we'd query users here or fix schema
    
    if (!project) throw AppError.notFound('Project');
    return project;
  }

  static async create(tenantId: string, data: any) {
    const existing = await prisma.project.findFirst({
      where: { tenantId, code: data.code }
    });
    if (existing) throw AppError.conflict('Project code already exists');

    return prisma.project.create({
      data: {
        ...data,
        tenantId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : undefined,
      }
    });
  }

  static async bulkCreate(tenantId: string, items: any[]) {
    const data = items.map(item => ({
      ...item,
      tenantId,
      startDate: item.startDate ? new Date(item.startDate) : undefined,
      plannedEndDate: item.plannedEndDate ? new Date(item.plannedEndDate) : undefined,
    }));
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
