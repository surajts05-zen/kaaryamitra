import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { AssetStatus } from '@prisma/client';

export class AssetsService {
  static async listCategories(tenantId: string) {
    return prisma.assetCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  static async createCategory(tenantId: string, name: string) {
    return prisma.assetCategory.create({
      data: { tenantId, name },
    });
  }

  static async deleteCategory(tenantId: string, categoryId: string) {
    return prisma.assetCategory.delete({
      where: { id: categoryId, tenantId },
    });
  }

  static async listAssets(tenantId: string) {
    return prisma.asset.findMany({
      where: { tenantId },
      include: {
        category: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createAsset(tenantId: string, data: any) {
    return prisma.asset.create({
      data: {
        tenantId,
        categoryId: data.categoryId,
        name: data.name,
        serialNumber: data.serialNumber,
        status: data.status || 'AVAILABLE',
        customFields: data.customFields || {},
      },
      include: {
        category: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      }
    });
  }

  static async updateAsset(tenantId: string, assetId: string, data: any) {
    return prisma.asset.update({
      where: { id: assetId, tenantId },
      data: {
        name: data.name,
        serialNumber: data.serialNumber,
        status: data.status,
        customFields: data.customFields,
      },
    });
  }

  static async deleteAsset(tenantId: string, assetId: string) {
    return prisma.asset.delete({
      where: { id: assetId, tenantId },
    });
  }

  static async assignAsset(tenantId: string, assetId: string, employeeId: string) {
    return prisma.asset.update({
      where: { id: assetId, tenantId },
      data: {
        assignedToId: employeeId,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
    });
  }

  static async unassignAsset(tenantId: string, assetId: string) {
    return prisma.asset.update({
      where: { id: assetId, tenantId },
      data: {
        assignedToId: null,
        assignedAt: null,
        status: 'AVAILABLE',
      },
    });
  }

  static async listEmployeeAssets(tenantId: string, employeeId: string) {
    return prisma.asset.findMany({
      where: { tenantId, assignedToId: employeeId },
      include: { category: true },
    });
  }
}
