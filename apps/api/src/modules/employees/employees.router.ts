import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  listEmployeesHandler,
  createEmployeeHandler,
  getEmployeeHandler,
  updateEmployeeHandler,
} from './employees.controller.js';

export const employeesRouter = Router({ mergeParams: true });

employeesRouter.get('/', asyncHandler(listEmployeesHandler));
employeesRouter.post('/', asyncHandler(createEmployeeHandler));
employeesRouter.get('/:id', asyncHandler(getEmployeeHandler));
employeesRouter.put('/:id', asyncHandler(updateEmployeeHandler));
