import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  listTenantsHandler,
  getTenantStatsHandler,
  createTenantHandler,
  updateTenantHandler,
  resetTenantAdminPasswordHandler,
  getPlatformSettingsHandler,
  updatePlatformSettingsHandler,
} from './admin.controller.js';

export const adminRouter = Router();

// Dashboard stats
adminRouter.get('/stats', asyncHandler(getTenantStatsHandler));

// Platform Settings
adminRouter.get('/settings', asyncHandler(getPlatformSettingsHandler));
adminRouter.patch('/settings', asyncHandler(updatePlatformSettingsHandler));

// Tenants CRUD
adminRouter.get('/tenants', asyncHandler(listTenantsHandler));
adminRouter.post('/tenants', asyncHandler(createTenantHandler));
adminRouter.patch('/tenants/:id', asyncHandler(updateTenantHandler));
adminRouter.post('/tenants/:id/reset-password', asyncHandler(resetTenantAdminPasswordHandler));
