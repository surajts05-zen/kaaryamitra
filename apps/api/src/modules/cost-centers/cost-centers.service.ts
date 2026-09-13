import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class CostCentersService {
  static async list(tenantId: string) {
    return prisma.costCenter.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
      include: {
        parent: { select: { id: true, name: true, code: true } },
      }
    });
  }

  static async getById(tenantId: string, id: string) {
    const cc = await prisma.costCenter.findFirst({
      where: { tenantId, id },
      include: {
        parent: { select: { id: true, name: true, code: true } },
      }
    });
    if (!cc) throw AppError.notFound('Cost Center');
    return cc;
  }

  static async create(tenantId: string, data: any) {
    const existing = await prisma.costCenter.findFirst({
      where: { tenantId, code: data.code }
    });
    if (existing) throw AppError.conflict('Cost center code already exists');

    return prisma.costCenter.create({
      data: { ...data, tenantId }
    });
  }

  static async bulkCreate(tenantId: string, items: any[]) {
    const data = items.map(item => ({ ...item, tenantId }));
    
    // Using createMany with skipDuplicates to ignore existing codes
    return prisma.costCenter.createMany({
      data,
      skipDuplicates: true
    });
  }

  static async update(tenantId: string, id: string, data: any) {
    await this.getById(tenantId, id); // Ensure it exists
    
    if (data.code) {
      const existing = await prisma.costCenter.findFirst({
        where: { tenantId, code: data.code, id: { not: id } }
      });
      if (existing) throw AppError.conflict('Cost center code already exists');
    }

    return prisma.costCenter.update({
      where: { id },
      data
    });
  }

  static async delete(tenantId: string, id: string) {
    const cc = await this.getById(tenantId, id);
    
    // Check constraints (e.g. if projects exist)
    const projectsCount = await prisma.project.count({ where: { costCenterId: id } });
    if (projectsCount > 0) throw AppError.conflict('Cannot delete cost center that has projects assigned');

    return prisma.costCenter.delete({
      where: { id }
    });
  }
}
