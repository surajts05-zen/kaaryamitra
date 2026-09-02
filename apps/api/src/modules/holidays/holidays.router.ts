import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  listHolidaysHandler,
  createHolidayHandler,
  updateHolidayHandler,
  deleteHolidayHandler,
} from './holidays.controller.js';

export const holidaysRouter = Router();

// Everyone in the tenant can view holidays
holidaysRouter.get('/', asyncHandler(listHolidaysHandler));

// Only HR/Admins can manage holidays
holidaysRouter.post(
  '/',
  requirePermission('settings:manage'), // Using 'settings:manage' as a reasonable permission for this
  asyncHandler(createHolidayHandler)
);

holidaysRouter.patch(
  '/:id',
  requirePermission('settings:manage'),
  asyncHandler(updateHolidayHandler)
);

holidaysRouter.delete(
  '/:id',
  requirePermission('settings:manage'),
  asyncHandler(deleteHolidayHandler)
);
