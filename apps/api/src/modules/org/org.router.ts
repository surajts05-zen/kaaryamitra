import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import {
  listDepartmentsHandler,
  createDepartmentHandler,
  listLocationsHandler,
  createLocationHandler,
  listDesignationsHandler,
  createDesignationHandler,
  listJobLevelsHandler,
  createJobLevelHandler,
  getCompanySettingsHandler,
  updateCompanySettingsHandler,
  listHolidaysHandler,
  createHolidayHandler,
} from './org.controller.js';

export const orgRouter = Router({ mergeParams: true });

// Settings & Config
orgRouter.get('/settings', asyncHandler(getCompanySettingsHandler));
orgRouter.put('/settings', asyncHandler(updateCompanySettingsHandler));

// Org Entities
orgRouter.get('/departments', asyncHandler(listDepartmentsHandler));
orgRouter.post('/departments', asyncHandler(createDepartmentHandler));

orgRouter.get('/locations', asyncHandler(listLocationsHandler));
orgRouter.post('/locations', asyncHandler(createLocationHandler));

orgRouter.get('/designations', asyncHandler(listDesignationsHandler));
orgRouter.post('/designations', asyncHandler(createDesignationHandler));

orgRouter.get('/job-levels', asyncHandler(listJobLevelsHandler));
orgRouter.post('/job-levels', asyncHandler(createJobLevelHandler));

// Holiday Calendar
orgRouter.get('/holidays', asyncHandler(listHolidaysHandler));
orgRouter.post('/holidays', asyncHandler(createHolidayHandler));
