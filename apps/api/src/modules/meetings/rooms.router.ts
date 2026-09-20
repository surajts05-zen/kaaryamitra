import { Router } from 'express';
import { roomsController } from './rooms.controller.js';
import { requirePermission } from '../../middleware/auth.js';

const router = Router();

// Define a unified resource for RBAC, assuming it's part of MEETINGS or SETTINGS
// Adjust the resource type as per the specific implementation, we will use 'MEETING' for now

router.get('/', requirePermission('meeting:read'), roomsController.getRooms);
router.get('/:id', requirePermission('meeting:read'), roomsController.getRoomById);
router.post('/', requirePermission('meeting:create'), roomsController.createRoom);
router.put('/:id', requirePermission('meeting:update'), roomsController.updateRoom);
router.delete('/:id', requirePermission('meeting:cancel'), roomsController.deleteRoom);

export { router as roomsRouter };
