import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { getDashboardStatsHandler } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', asyncHandler(getDashboardStatsHandler));
