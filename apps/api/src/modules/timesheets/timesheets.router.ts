import { Router } from 'express';
import {
  generateTimesheetHandler,
  getTimesheetHandler,
  submitTimesheetHandler,
  bulkCreateTimesheetsHandler
} from './timesheets.controller.js';
import { requireAuth } from '../../middleware/auth.js';

export const timesheetsRouter = Router();

// Employee Self-Service Timesheet Endpoints
timesheetsRouter.post('/generate', requireAuth, generateTimesheetHandler);
timesheetsRouter.post('/bulk', requireAuth, bulkCreateTimesheetsHandler);
timesheetsRouter.get('/:id', requireAuth, getTimesheetHandler);
timesheetsRouter.post('/:id/submit', requireAuth, submitTimesheetHandler);
