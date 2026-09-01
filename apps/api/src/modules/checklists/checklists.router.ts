import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  listTemplatesHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  listEmployeeChecklistsHandler,
  assignChecklistHandler,
  updateTaskStatusHandler,
} from './checklists.controller.js';

export const templatesRouter = Router();
export const employeeChecklistsRouter = Router({ mergeParams: true });

// Admin: Templates
templatesRouter.get('/', requireAuth, asyncHandler(listTemplatesHandler));
templatesRouter.post('/', requireAuth, requirePermission('settings:manage'), asyncHandler(createTemplateHandler));
templatesRouter.put('/:id', requireAuth, requirePermission('settings:manage'), asyncHandler(updateTemplateHandler));
templatesRouter.delete('/:id', requireAuth, requirePermission('settings:manage'), asyncHandler(deleteTemplateHandler));

// Employee Checklists
employeeChecklistsRouter.get('/', requireAuth, asyncHandler(listEmployeeChecklistsHandler));
employeeChecklistsRouter.post('/', requireAuth, requirePermission('users:manage'), asyncHandler(assignChecklistHandler));
employeeChecklistsRouter.patch('/tasks/:taskId/status', requireAuth, asyncHandler(updateTaskStatusHandler));
