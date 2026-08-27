import { Router } from 'express';
import { requireAuth, resolveTenant } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import * as controller from './attendance.controller.js';

export const meAttendanceRouter = Router({ mergeParams: true });

meAttendanceRouter.use(requireAuth, resolveTenant);

meAttendanceRouter.get('/', asyncHandler(controller.getMyAttendanceHandler));
meAttendanceRouter.post('/check-in', asyncHandler(controller.checkInHandler));
meAttendanceRouter.post('/check-out', asyncHandler(controller.checkOutHandler));
meAttendanceRouter.post('/break/start', asyncHandler(controller.startBreakHandler));
meAttendanceRouter.post('/break/end', asyncHandler(controller.endBreakHandler));
meAttendanceRouter.post('/regularize', asyncHandler(controller.requestRegularizationHandler));
