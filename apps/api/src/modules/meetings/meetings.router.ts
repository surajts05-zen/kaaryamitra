import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import * as controller from './meetings.controller.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = Router();

// Ensure user is authenticated and belongs to a tenant
router.use(requireAuth);

router.get('/', asyncHandler(controller.listHandler));
router.get('/:id', asyncHandler(controller.getHandler));

router.get('/calendar/auth', requirePermission('calendar.sync'), asyncHandler(controller.getGoogleAuthUrlHandler));
router.get('/calendar/callback', asyncHandler(controller.googleAuthCallbackHandler));

router.post('/availability', requirePermission('meeting:read'), asyncHandler(controller.getAvailabilityHandler));
router.post('/', requirePermission('meeting:create'), asyncHandler(controller.createHandler));
router.patch('/:id', requirePermission('meeting:update'), asyncHandler(controller.updateHandler));
router.post('/:id/cancel', requirePermission('meeting:cancel'), asyncHandler(controller.cancelHandler));

export { router as meetingsRouter };
