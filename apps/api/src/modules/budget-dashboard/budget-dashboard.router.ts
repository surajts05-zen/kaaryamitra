import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  overviewHandler
} from './budget-dashboard.controller.js';

export const budgetDashboardRouter = Router({ mergeParams: true });

budgetDashboardRouter.get('/', requirePermission('budget:read'), asyncHandler(overviewHandler));
