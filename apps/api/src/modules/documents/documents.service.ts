import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { StorageService } from '../../lib/storage.js';
import { DocumentStatus } from '@prisma/client';

export class DocumentsService {
  // ── Categories (Admin/HR) ──────────────────────────────────────────────────
  
  static async createCategory(tenantId: string, data: any) {
    return prisma.documentCategory.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  static async listCategories(tenantId: string) {
    return prisma.documentCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  static async updateCategory(tenantId: string, id: string, data: any) {
    return prisma.documentCategory.update({
      where: { id, tenantId },
      data,
    });
  }

  static async deleteCategory(tenantId: string, id: string) {
    return prisma.documentCategory.delete({
      where: { id, tenantId },
    });
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  static async listEmployeeDocuments(tenantId: string, employeeId: string) {
    return prisma.document.findMany({
      where: { tenantId, employeeId },
      include: {
        category: true,
        verifier: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getDocument(tenantId: string, id: string) {
    const doc = await prisma.document.findUnique({
      where: { id, tenantId },
      include: {
        category: true,
        versions: {
          orderBy: { version: 'desc' },
          include: {
            uploader: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!doc) throw AppError.notFound('Document');
    return doc;
  }

  static async uploadDocument(
    tenantId: string,
    employeeId: string,
    userId: string,
    file: Express.Multer.File,
    data: { categoryId: string; title: string; description?: string; expiresAt?: string }
  ) {
    // 1. Check if category exists
    const category = await prisma.documentCategory.findUnique({
      where: { id: data.categoryId, tenantId },
    });
    if (!category) throw AppError.notFound('DocumentCategory');

    // 2. Upload to Storage
    const ext = file.originalname.split('.').pop() || 'tmp';
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const key = StorageService.buildKey({ tenantId, module: 'documents', filename });
    
    await StorageService.upload({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    // 3. Create Document and first Version in a transaction
    return prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          tenantId,
          employeeId,
          categoryId: data.categoryId,
          title: data.title,
          description: data.description || null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          fileUrl: key,
          fileType: file.mimetype,
          fileSize: file.size,
          status: 'VALID',
        },
      });

      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          fileUrl: key,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadedBy: userId,
          changeNote: 'Initial upload',
        },
      });

      return doc;
    });
  }

  static async uploadNewVersion(
    tenantId: string,
    documentId: string,
    userId: string,
    file: Express.Multer.File,
    changeNote?: string
  ) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId, tenantId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!doc) throw AppError.notFound('Document');

    const nextVersion = doc.versions.length > 0 ? doc.versions[0]!.version + 1 : 1;

    // Upload to Storage
    const ext = file.originalname.split('.').pop() || 'tmp';
    const filename = `${Date.now()}_v${nextVersion}.${ext}`;
    const key = StorageService.buildKey({ tenantId, module: 'documents', filename });
    
    await StorageService.upload({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    return prisma.$transaction(async (tx) => {
      // Create version
      const version = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: nextVersion,
          fileUrl: key,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadedBy: userId,
          changeNote: changeNote || null,
        },
      });

      // Update document root pointer
      const updatedDoc = await tx.document.update({
        where: { id: doc.id },
        data: {
          fileUrl: key,
          fileType: file.mimetype,
          fileSize: file.size,
          isVerified: false, // reset verification on new version
          verifiedAt: null,
          verifiedById: null,
        },
      });

      return updatedDoc;
    });
  }

  static async verifyDocument(tenantId: string, id: string, userId: string, status: DocumentStatus) {
    return prisma.document.update({
      where: { id, tenantId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById: userId,
        status,
      },
    });
  }

  static async getPreviewUrl(tenantId: string, id: string, versionId?: string) {
    const doc = await prisma.document.findUnique({
      where: { id, tenantId },
      include: { versions: true },
    });
    if (!doc) throw AppError.notFound('Document');

    let targetFileUrl = doc.fileUrl;
    if (versionId) {
      const v = doc.versions.find((v) => v.id === versionId);
      if (v) targetFileUrl = v.fileUrl;
    }

    const url = await StorageService.getSignedUrl(targetFileUrl);
    return { url };
  }
}
