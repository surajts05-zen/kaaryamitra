import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import * as controller from './meeting-types.controller.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(controller.listHandler));
router.post('/', requirePermission('meeting.template.manage'), asyncHandler(controller.createHandler));
router.post('/seed-defaults', requirePermission('meeting.template.manage'), asyncHandler(controller.seedDefaultsHandler));
router.patch('/:id', requirePermission('meeting.template.manage'), asyncHandler(controller.updateHandler));

export { router as meetingTypesRouter };
