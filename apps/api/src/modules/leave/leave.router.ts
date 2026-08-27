import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  listLeaveTypesHandler,
  createLeaveTypeHandler,
  updateLeaveTypeHandler,
  listMyLeaveBalancesHandler,
  listMyLeaveApplicationsHandler,
  applyLeaveHandler,
  listPendingApprovalsHandler,
  reviewLeaveApplicationHandler
} from './leave.controller.js';

export const leaveRouter = Router({ mergeParams: true });
export const essLeaveRouter = Router({ mergeParams: true });
export const leaveApprovalsRouter = Router({ mergeParams: true });

// Admin Settings
leaveRouter.get('/types', asyncHandler(listLeaveTypesHandler));
leaveRouter.post('/types', asyncHandler(createLeaveTypeHandler));
leaveRouter.put('/types/:id', asyncHandler(updateLeaveTypeHandler));

// Employee Self Service
essLeaveRouter.get('/balances', asyncHandler(listMyLeaveBalancesHandler));
essLeaveRouter.get('/applications', asyncHandler(listMyLeaveApplicationsHandler));
essLeaveRouter.post('/applications', asyncHandler(applyLeaveHandler));

// Manager Approvals
leaveApprovalsRouter.get('/pending', asyncHandler(listPendingApprovalsHandler));
leaveApprovalsRouter.put('/:id/review', asyncHandler(reviewLeaveApplicationHandler));
