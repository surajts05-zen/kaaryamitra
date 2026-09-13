import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  listHandler,
  getHandler,
  submitHandler,
  approveHandler,
  rejectHandler
} from './project-expenses.controller.js';

export const projectExpensesRouter = Router({ mergeParams: true });

projectExpensesRouter.get('/', requirePermission('budget:manage'), asyncHandler(listHandler));
projectExpensesRouter.post('/', requirePermission('budget:request'), asyncHandler(submitHandler));
projectExpensesRouter.get('/:id', requirePermission('budget:manage'), asyncHandler(getHandler));

projectExpensesRouter.post('/:id/approve', requirePermission('budget:approve'), asyncHandler(approveHandler));
projectExpensesRouter.post('/:id/reject', requirePermission('budget:approve'), asyncHandler(rejectHandler));
