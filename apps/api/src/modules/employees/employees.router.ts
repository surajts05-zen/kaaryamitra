import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  listEmployeesHandler,
  createEmployeeHandler,
  getEmployeeHandler,
  updateEmployeeHandler,
  resetPasswordHandler,
  bulkCreateEmployeesHandler
} from './employees.controller.js';
import { employeeDocumentsRouter } from '../documents/documents.router.js';
import { employeeAssetsRouter } from '../assets/assets.router.js';
import { employeeChecklistsRouter } from '../checklists/checklists.router.js';

export const employeesRouter = Router({ mergeParams: true });

employeesRouter.get('/', asyncHandler(listEmployeesHandler));
employeesRouter.post('/', asyncHandler(createEmployeeHandler));
employeesRouter.post('/bulk', requirePermission('employee:create'), asyncHandler(bulkCreateEmployeesHandler));
employeesRouter.get('/:id', asyncHandler(getEmployeeHandler));
employeesRouter.put('/:id', asyncHandler(updateEmployeeHandler));
employeesRouter.post('/:id/reset-password', requirePermission('employee:update'), asyncHandler(resetPasswordHandler));

// Sub-router for employee documents
employeesRouter.use('/:employeeId/documents', employeeDocumentsRouter);
employeesRouter.use('/:employeeId/assets', employeeAssetsRouter);
employeesRouter.use('/:employeeId/checklists', employeeChecklistsRouter);
