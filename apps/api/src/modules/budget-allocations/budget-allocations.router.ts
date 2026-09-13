import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  listHandler,
  createHandler,
  deleteHandler
} from './budget-allocations.controller.js';

export const budgetAllocationsRouter = Router({ mergeParams: true });

// Note: Mounted under /projects/:projectId/allocations
budgetAllocationsRouter.get('/', requirePermission('budget:read'), asyncHandler(listHandler));
budgetAllocationsRouter.post('/', requirePermission('budget:manage'), asyncHandler(createHandler));
budgetAllocationsRouter.delete('/:id', requirePermission('budget:manage'), asyncHandler(deleteHandler));
