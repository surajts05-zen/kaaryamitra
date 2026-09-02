import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { AssetsController } from './assets.controller.js';

export const assetsRouter = Router();
export const employeeAssetsRouter = Router({ mergeParams: true });

// Admin: Categories
assetsRouter.get('/categories', requireAuth, asyncHandler(AssetsController.getCategories));
assetsRouter.post('/categories', requireAuth, requirePermission('settings:manage'), asyncHandler(AssetsController.createCategory));

// Admin: Assets
assetsRouter.get('/', requireAuth, asyncHandler(AssetsController.getAssets));
assetsRouter.post('/', requireAuth, requirePermission('settings:manage'), asyncHandler(AssetsController.createAsset));
assetsRouter.get('/:id', requireAuth, asyncHandler(AssetsController.getAssetById));
assetsRouter.put('/:id', requireAuth, requirePermission('settings:manage'), asyncHandler(AssetsController.updateAsset));
assetsRouter.delete('/:id', requireAuth, requirePermission('settings:manage'), asyncHandler(AssetsController.deleteAsset));

// Admin: Lifecycle
assetsRouter.post('/:id/assign', requireAuth, requirePermission('settings:manage'), asyncHandler(AssetsController.assignAsset));
assetsRouter.post('/:id/return', requireAuth, requirePermission('settings:manage'), asyncHandler(AssetsController.returnAsset));

// Employee Assets (ESS)
employeeAssetsRouter.get('/', requireAuth, asyncHandler(AssetsController.getMyAssets));
employeeAssetsRouter.post('/:id/acknowledge', requireAuth, asyncHandler(AssetsController.acknowledgeAsset));
