import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(requireAuth);

// Get available datasets metadata
router.get('/meta', asyncHandler(ReportsController.getMeta));

// Execute a dynamic report query
router.post('/query', asyncHandler(ReportsController.executeQuery));

// Saved Reports CRUD
router.post('/saved', asyncHandler(ReportsController.createSavedReport));
router.get('/saved', asyncHandler(ReportsController.getSavedReports));
router.get('/saved/:id', asyncHandler(ReportsController.getSavedReport));
router.put('/saved/:id', asyncHandler(ReportsController.updateSavedReport));
router.delete('/saved/:id', asyncHandler(ReportsController.deleteSavedReport));

export { router as reportsRouter };
