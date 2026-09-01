import { Router } from 'express';
import {
  createShiftHandler,
  getShiftsHandler,
  updateShiftHandler,
  deleteShiftHandler,
  assignShiftHandler,
  getEmployeeShiftsHandler,
  getDailyScheduleHandler
} from './shifts.controller.js';
import { requirePermission } from '../../middleware/auth.js';

export const shiftsRouter = Router();

// CRUD for Shift Templates (HR/Admin)
shiftsRouter.post('/', requirePermission('settings:manage'), createShiftHandler);
shiftsRouter.get('/', getShiftsHandler); // Everyone needs to see available shifts for dropdowns or view
shiftsRouter.put('/:id', requirePermission('settings:manage'), updateShiftHandler);
shiftsRouter.delete('/:id', requirePermission('settings:manage'), deleteShiftHandler);

// Shift Assignment
shiftsRouter.post('/assign', requirePermission('settings:manage'), assignShiftHandler);
shiftsRouter.get('/daily-schedule', getDailyScheduleHandler);
shiftsRouter.get('/employee/:employeeId', getEmployeeShiftsHandler);
