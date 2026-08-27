import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  listNotificationsHandler,
  markReadHandler,
  markAllReadHandler,
} from './notification.controller.js';

export const notificationsRouter = Router();

// GET  /api/v1/notifications          — list + unread count
notificationsRouter.get('/', asyncHandler(listNotificationsHandler));

// PATCH /api/v1/notifications/read-all — mark all as read
notificationsRouter.patch('/read-all', asyncHandler(markAllReadHandler));

// PATCH /api/v1/notifications/:id/read — mark one as read
notificationsRouter.patch('/:id/read', asyncHandler(markReadHandler));
