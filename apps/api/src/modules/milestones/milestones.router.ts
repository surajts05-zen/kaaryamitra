import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler
} from './milestones.controller.js';

export const milestonesRouter = Router({ mergeParams: true });

// Note: Mounted under /projects/:projectId/milestones
milestonesRouter.get('/', requirePermission('projects:read'), asyncHandler(listHandler));
milestonesRouter.post('/', requirePermission('projects:manage'), asyncHandler(createHandler));
milestonesRouter.get('/:id', requirePermission('projects:read'), asyncHandler(getHandler));
milestonesRouter.put('/:id', requirePermission('projects:manage'), asyncHandler(updateHandler));
milestonesRouter.delete('/:id', requirePermission('projects:manage'), asyncHandler(deleteHandler));
