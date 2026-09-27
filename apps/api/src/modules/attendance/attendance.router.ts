import { Router } from 'express';
import { requireAuth, resolveTenant } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import * as controller from './attendance.controller.js';

// ─────────────────────────────────────────────────────────────────────────────
// ESS Routes: /me/attendance/*
// ─────────────────────────────────────────────────────────────────────────────

export const meAttendanceRouter = Router({ mergeParams: true });

meAttendanceRouter.use(requireAuth, resolveTenant);

meAttendanceRouter.get('/', asyncHandler(controller.getMyAttendanceHandler));
meAttendanceRouter.get('/today', asyncHandler(controller.getTodayStatusHandler));
meAttendanceRouter.post('/check-in', asyncHandler(controller.checkInHandler));
meAttendanceRouter.post('/check-out', asyncHandler(controller.checkOutHandler));
meAttendanceRouter.post('/break/start', asyncHandler(controller.startBreakHandler));
meAttendanceRouter.post('/break/end', asyncHandler(controller.endBreakHandler));
meAttendanceRouter.post('/regularize', asyncHandler(controller.requestRegularizationHandler));
meAttendanceRouter.post('/bulk', asyncHandler(controller.bulkCreateAttendanceHandler));

// ─────────────────────────────────────────────────────────────────────────────
// Admin Routes: /attendance/*
// ─────────────────────────────────────────────────────────────────────────────

export const adminAttendanceRouter = Router({ mergeParams: true });

adminAttendanceRouter.use(requireAuth, resolveTenant);

// Attendance records
adminAttendanceRouter.get('/', asyncHandler(controller.getAttendanceRecordsHandler));
adminAttendanceRouter.get('/today', asyncHandler(controller.getTodayOverviewHandler));
adminAttendanceRouter.post('/bulk', asyncHandler(controller.bulkCreateAttendanceHandler));

// Correction management
adminAttendanceRouter.get('/corrections', asyncHandler(controller.getPendingCorrectionsHandler));
adminAttendanceRouter.post('/corrections/:id/approve', asyncHandler(controller.approveCorrectionHandler));
adminAttendanceRouter.post('/corrections/:id/reject', asyncHandler(controller.rejectCorrectionHandler));

// Trusted networks
adminAttendanceRouter.get('/networks', asyncHandler(controller.getTrustedNetworksHandler));
adminAttendanceRouter.post('/networks', asyncHandler(controller.createTrustedNetworkHandler));
adminAttendanceRouter.put('/networks/:id', asyncHandler(controller.updateTrustedNetworkHandler));
adminAttendanceRouter.delete('/networks/:id', asyncHandler(controller.deleteTrustedNetworkHandler));
