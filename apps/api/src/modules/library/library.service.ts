import { prisma } from '../../lib/prisma.js';
import { StorageService } from '../../lib/storage.js';
import { LibraryItemType } from '@prisma/client';

export class LibraryService {
  /**
   * FOLDERS
   */
  static async createFolder(data: { tenantId: string; name: string; parentId: string | null; createdBy: string }) {
    return prisma.libraryFolder.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        parentId: data.parentId,
        createdBy: data.createdBy,
      },
    });
  }

  static async getFolders(tenantId: string, parentId: string | null) {
    return prisma.libraryFolder.findMany({
      where: { tenantId, parentId },
      orderBy: { name: 'asc' },
    });
  }

  static async updateFolder(tenantId: string, folderId: string, name: string) {
    const folder = await prisma.libraryFolder.update({
      where: { id: folderId, tenantId },
      data: { name },
    });
    return folder;
  }

  static async deleteFolder(tenantId: string, folderId: string) {
    // Delete all child items
    const items = await prisma.libraryItem.findMany({ where: { folderId, tenantId } });
    for (const item of items) {
      if (item.fileKey) {
        await StorageService.delete(item.fileKey);
      }
    }
    await prisma.libraryItem.deleteMany({ where: { folderId, tenantId } });
    
    // Also delete child folders (simplified - does not go deep recursively, assumes 1 level for now)
    await prisma.libraryFolder.deleteMany({ where: { parentId: folderId, tenantId } });

    const folder = await prisma.libraryFolder.delete({ where: { id: folderId, tenantId } });
    return folder;
  }

  /**
   * ITEMS
   */
  static async getItems(tenantId: string, folderId: string | null, type?: LibraryItemType) {
    const where: any = { tenantId, folderId };
    if (type) where.type = type;

    return prisma.libraryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
  }

  static async getPinnedAnnouncements(tenantId: string) {
    return prisma.libraryItem.findMany({
      where: { tenantId, isPinned: true, type: LibraryItemType.ANNOUNCEMENT },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } }
      }
    });
  }

  static async createArticle(data: {
    tenantId: string;
    title: string;
    content: string;
    type: LibraryItemType;
    folderId: string | null;
    tags?: string[];
    isPinned?: boolean;
    createdBy: string;
  }) {
    return prisma.libraryItem.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        content: data.content,
        type: data.type,
        folderId: data.folderId,
        tags: data.tags ?? [],
        isPinned: data.isPinned ?? false,
        createdBy: data.createdBy,
      },
    });
  }

  static async updateArticle(tenantId: string, itemId: string, data: any) {
    // Ensure we don't pass undefined properties where null is expected in Prisma
    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const item = await prisma.libraryItem.update({
      where: { id: itemId, tenantId },
      data: updateData,
    });
    return item;
  }

  static async deleteItem(tenantId: string, itemId: string) {
    const item = await prisma.libraryItem.findFirst({ where: { id: itemId, tenantId } });
    if (!item) throw new Error('Item not found');

    if (item.fileKey) {
      await StorageService.delete(item.fileKey);
    }

    await prisma.libraryItem.delete({ where: { id: itemId, tenantId } });
    return item;
  }
}
