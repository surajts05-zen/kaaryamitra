import { Request, Response } from 'express';
import { DocumentsService } from './documents.service.js';
import { AppError } from '../../lib/errors.js';
import { createCategorySchema, updateCategorySchema, verifyDocumentSchema } from './documents.schema.js';

export async function createCategoryHandler(req: Request, res: Response) {
  const data = createCategorySchema.parse(req.body);
  const category = await DocumentsService.createCategory(req.tenantId!, data);
  res.status(201).json({ success: true, data: category });
}

export async function listCategoriesHandler(req: Request, res: Response) {
  const categories = await DocumentsService.listCategories(req.tenantId!);
  res.json({ success: true, data: categories });
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const data = updateCategorySchema.parse(req.body);
  const category = await DocumentsService.updateCategory(req.tenantId!, req.params['id'] as string, data);
  res.json({ success: true, data: category });
}

export async function deleteCategoryHandler(req: Request, res: Response) {
  await DocumentsService.deleteCategory(req.tenantId!, req.params['id'] as string);
  res.status(204).send();
}

export async function listEmployeeDocumentsHandler(req: Request, res: Response) {
  const docs = await DocumentsService.listEmployeeDocuments(req.tenantId!, req.params['employeeId'] as string);
  res.json({ success: true, data: docs });
}

export async function getDocumentHandler(req: Request, res: Response) {
  const doc = await DocumentsService.getDocument(req.tenantId!, req.params['id'] as string);
  res.json({ success: true, data: doc });
}

export async function uploadDocumentHandler(req: Request, res: Response) {
  if (!req.file) throw AppError.badRequest('File is required');
  const body = req.body;
  // Basic validation
  if (!body.categoryId || !body.title) {
    throw AppError.badRequest('categoryId and title are required');
  }

  const doc = await DocumentsService.uploadDocument(
    req.tenantId!,
    req.params['employeeId'] as string,
    req.auth!.userId,
    req.file,
    {
      categoryId: body.categoryId,
      title: body.title,
      description: body.description,
      expiresAt: body.expiresAt,
    }
  );
  res.status(201).json({ success: true, data: doc });
}

export async function uploadNewVersionHandler(req: Request, res: Response) {
  if (!req.file) throw AppError.badRequest('File is required');
  const doc = await DocumentsService.uploadNewVersion(
    req.tenantId!,
    req.params['id'] as string,
    req.auth!.userId,
    req.file,
    req.body.changeNote
  );
  res.status(201).json({ success: true, data: doc });
}

export async function verifyDocumentHandler(req: Request, res: Response) {
  const data = verifyDocumentSchema.parse(req.body);
  const doc = await DocumentsService.verifyDocument(req.tenantId!, req.params['id'] as string, req.auth!.userId, data.status);
  res.json({ success: true, data: doc });
}

export async function getDocumentPreviewUrlHandler(req: Request, res: Response) {
  const { url } = await DocumentsService.getPreviewUrl(
    req.tenantId!,
    req.params['id'] as string,
    req.query['versionId'] as string
  );
  res.json({ success: true, data: { url } });
}
