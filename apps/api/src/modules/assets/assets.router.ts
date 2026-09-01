import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  listCategoriesHandler,
  createCategoryHandler,
  deleteCategoryHandler,
  listAssetsHandler,
  createAssetHandler,
  updateAssetHandler,
  deleteAssetHandler,
  assignAssetHandler,
  listEmployeeAssetsHandler,
} from './assets.controller.js';

export const assetsRouter = Router();
export const employeeAssetsRouter = Router({ mergeParams: true });

// Admin: Categories
assetsRouter.get('/categories', requireAuth, asyncHandler(listCategoriesHandler));
assetsRouter.post('/categories', requireAuth, requirePermission('settings:manage'), asyncHandler(createCategoryHandler));
assetsRouter.delete('/categories/:id', requireAuth, requirePermission('settings:manage'), asyncHandler(deleteCategoryHandler));

// Admin: Assets
assetsRouter.get('/', requireAuth, asyncHandler(listAssetsHandler));
assetsRouter.post('/', requireAuth, requirePermission('settings:manage'), asyncHandler(createAssetHandler));
assetsRouter.put('/:id', requireAuth, requirePermission('settings:manage'), asyncHandler(updateAssetHandler));
assetsRouter.delete('/:id', requireAuth, requirePermission('settings:manage'), asyncHandler(deleteAssetHandler));
assetsRouter.patch('/:id/assign', requireAuth, requirePermission('settings:manage'), asyncHandler(assignAssetHandler));

// Employee Assets
employeeAssetsRouter.get('/', requireAuth, asyncHandler(listEmployeeAssetsHandler));
