import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { AssetStatus, AssetAssignmentStatus } from '@prisma/client';

export class AssetsService {
  // ─── Categories ────────────────────────────────────────────────────────────

  static async getCategories(tenantId: string) {
    return prisma.assetCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  static async createCategory(tenantId: string, data: any) {
    return prisma.assetCategory.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  // ─── Assets ────────────────────────────────────────────────────────────────

  static async getAssets(tenantId: string, filters: any = {}) {
    const { categoryId, status, search } = filters;
    const where: any = { tenantId };

    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.asset.findMany({
      where,
      include: {
        category: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getAssetById(tenantId: string, assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId, tenantId },
      include: {
        category: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, employeeCode: true },
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            assignedBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!asset) throw AppError.notFound('Asset');
    return asset;
  }

  static async createAsset(tenantId: string, data: any) {
    return prisma.asset.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  static async updateAsset(tenantId: string, assetId: string, data: any) {
    return prisma.asset.update({
      where: { id: assetId, tenantId },
      data,
    });
  }

  static async deleteAsset(tenantId: string, assetId: string) {
    // Check if it's currently assigned
    const asset = await prisma.asset.findUnique({ where: { id: assetId, tenantId } });
    if (!asset) throw AppError.notFound('Asset');
    if (asset.status === AssetStatus.ASSIGNED) {
      throw AppError.badRequest('Cannot delete an asset that is currently assigned');
    }

    return prisma.asset.delete({
      where: { id: assetId, tenantId },
    });
  }

  // ─── Assignments & Lifecycle ───────────────────────────────────────────────

  static async assignAsset(tenantId: string, assetId: string, employeeId: string, assignedById: string, notes?: string) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId, tenantId } });
    if (!asset) throw AppError.notFound('Asset');
    if (asset.status === AssetStatus.ASSIGNED) {
      throw AppError.badRequest('Asset is already assigned');
    }

    // Use a transaction to create assignment and update asset
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.create({
        data: {
          tenantId,
          assetId,
          employeeId,
          assignedById,
          notes: notes ?? null,
          status: AssetAssignmentStatus.PENDING_ACKNOWLEDGEMENT,
        },
      });

      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: {
          status: AssetStatus.ASSIGNED,
          assignedToId: employeeId,
          assignedAt: new Date(),
        },
      });

      return { assignment, asset: updatedAsset };
    });
  }

  static async acknowledgeAsset(tenantId: string, assetId: string, employeeId: string) {
    const assignment = await prisma.assetAssignment.findFirst({
      where: {
        tenantId,
        assetId,
        employeeId,
        status: AssetAssignmentStatus.PENDING_ACKNOWLEDGEMENT,
      },
      orderBy: { assignedAt: 'desc' },
    });

    if (!assignment) {
      throw AppError.notFound('No pending assignment found to acknowledge');
    }

    return prisma.assetAssignment.update({
      where: { id: assignment.id },
      data: {
        status: AssetAssignmentStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      },
    });
  }

  static async returnAsset(tenantId: string, assetId: string, returnCondition: string, notes?: string) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId, tenantId } });
    if (!asset) throw AppError.notFound('Asset');
    if (asset.status !== AssetStatus.ASSIGNED) {
      throw AppError.badRequest('Asset is not currently assigned');
    }

    // Find the current active assignment
    const currentAssignment = await prisma.assetAssignment.findFirst({
      where: { assetId, tenantId, status: { not: AssetAssignmentStatus.RETURNED } },
      orderBy: { assignedAt: 'desc' },
    });

    return prisma.$transaction(async (tx) => {
      if (currentAssignment) {
        await tx.assetAssignment.update({
          where: { id: currentAssignment.id },
          data: {
            status: AssetAssignmentStatus.RETURNED,
            returnedAt: new Date(),
            returnCondition,
            notes: notes ? `${currentAssignment.notes || ''}\nReturn Note: ${notes}` : currentAssignment.notes,
          },
        });
      }

      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: {
          status: AssetStatus.AVAILABLE,
          assignedToId: null,
          assignedAt: null,
        },
      });

      return updatedAsset;
    });
  }

  static async getEmployeeAssets(tenantId: string, employeeId: string) {
    return prisma.asset.findMany({
      where: { tenantId, assignedToId: employeeId },
      include: {
        category: true,
        assignments: {
          where: { employeeId, status: { not: AssetAssignmentStatus.RETURNED } },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  static async bulkCreateAssets(tenantId: string, items: Array<{ name: string; category?: string; serialNumber?: string; assetTag?: string; status?: string }>) {
    const created: any[] = [];
    
    // Cache categories for this tenant
    const existingCategories = await this.getCategories(tenantId);
    const categoryMap = new Map<string, string>();
    existingCategories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

    for (const item of items) {
      if (!item.name) continue;
      try {
        const catName = item.category ? item.category.trim() : 'General';
        let categoryId = categoryMap.get(catName.toLowerCase());

        if (!categoryId) {
          const newCat = await this.createCategory(tenantId, { name: catName });
          categoryId = newCat.id;
          categoryMap.set(catName.toLowerCase(), categoryId);
        }

        const asset = await this.createAsset(tenantId, {
          name: item.name.trim(),
          categoryId,
          serialNumber: item.serialNumber ? item.serialNumber.trim() : null,
          assetTag: item.assetTag ? item.assetTag.trim() : null,
          status: item.status ? item.status.toUpperCase() : 'AVAILABLE',
        });
        created.push(asset);
      } catch (err) {
        console.error(`Failed to bulk create asset ${item.name}:`, err);
      }
    }
    return created;
  }
}
