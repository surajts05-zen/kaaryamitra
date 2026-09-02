import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  submitResignationHandler,
  getMyResignationHandler,
  listResignationsHandler,
  updateResignationStatusHandler,
  updateClearanceHandler,
} from './resignations.controller.js';

export const resignationsRouter = Router();

// Employee endpoints
resignationsRouter.post('/my', requireAuth, asyncHandler(submitResignationHandler));
resignationsRouter.get('/my', requireAuth, asyncHandler(getMyResignationHandler));

// Admin / HR endpoints
resignationsRouter.get('/', requireAuth, requirePermission('employee:update'), asyncHandler(listResignationsHandler));
resignationsRouter.patch('/:id/status', requireAuth, requirePermission('employee:update'), asyncHandler(updateResignationStatusHandler));
resignationsRouter.patch('/:id/clearance', requireAuth, requirePermission('employee:update'), asyncHandler(updateClearanceHandler));
