import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission as requirePermissions } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  createCategoryHandler,
  listCategoriesHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listEmployeeDocumentsHandler,
  getDocumentHandler,
  uploadDocumentHandler,
  uploadNewVersionHandler,
  verifyDocumentHandler,
  getDocumentPreviewUrlHandler,
} from './documents.controller.js';

export const documentsRouter = Router();
export const employeeDocumentsRouter = Router({ mergeParams: true });

// Configure Multer (memory storage for 5MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Admin: Categories ────────────────────────────────────────────────────────
documentsRouter.get('/categories', requireAuth, asyncHandler(listCategoriesHandler));
documentsRouter.post('/categories', requireAuth, requirePermissions('settings:manage'), asyncHandler(createCategoryHandler));
documentsRouter.put('/categories/:id', requireAuth, requirePermissions('settings:manage'), asyncHandler(updateCategoryHandler));
documentsRouter.delete('/categories/:id', requireAuth, requirePermissions('settings:manage'), asyncHandler(deleteCategoryHandler));

// ── Document Details & Actions ────────────────────────────────────────────────
documentsRouter.get('/:id', requireAuth, asyncHandler(getDocumentHandler));
documentsRouter.get('/:id/preview', requireAuth, asyncHandler(getDocumentPreviewUrlHandler));
documentsRouter.post('/:id/versions', requireAuth, upload.single('file'), asyncHandler(uploadNewVersionHandler));
documentsRouter.patch('/:id/verify', requireAuth, requirePermissions('document:manage'), asyncHandler(verifyDocumentHandler));

// ── Employee Documents (Mounted at /employees/:employeeId/documents) ──────────
employeeDocumentsRouter.get('/', requireAuth, asyncHandler(listEmployeeDocumentsHandler));
employeeDocumentsRouter.post('/', requireAuth, upload.single('file'), asyncHandler(uploadDocumentHandler));
