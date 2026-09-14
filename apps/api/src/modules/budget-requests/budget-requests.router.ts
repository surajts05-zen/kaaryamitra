import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  submitHandler,
  approveHandler,
  rejectHandler,
  recallHandler,
  returnHandler,
  archiveHandler
} from './budget-requests.controller.js';

export const budgetRequestsRouter = Router({ mergeParams: true });

budgetRequestsRouter.get('/', requirePermission('budget:request'), asyncHandler(listHandler));
budgetRequestsRouter.post('/', requirePermission('budget:request'), asyncHandler(createHandler));
budgetRequestsRouter.get('/:id', requirePermission('budget:request'), asyncHandler(getHandler));
budgetRequestsRouter.put('/:id', requirePermission('budget:request'), asyncHandler(updateHandler));

budgetRequestsRouter.post('/:id/submit', requirePermission('budget:request'), asyncHandler(submitHandler));
budgetRequestsRouter.post('/:id/recall', requirePermission('budget:request'), asyncHandler(recallHandler));
budgetRequestsRouter.post('/:id/approve', requirePermission('budget:approve'), asyncHandler(approveHandler));
budgetRequestsRouter.post('/:id/reject', requirePermission('budget:approve'), asyncHandler(rejectHandler));
budgetRequestsRouter.post('/:id/return', requirePermission('budget:approve'), asyncHandler(returnHandler));
budgetRequestsRouter.put('/:id/archive', requirePermission('budget:request'), asyncHandler(archiveHandler));
