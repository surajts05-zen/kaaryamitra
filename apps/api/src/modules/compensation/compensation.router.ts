import { Router } from 'express';
import { CompensationController } from './compensation.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// ESS Routes (My Compensation)
router.get('/me', CompensationController.getMyCompensation);
router.get('/me/history', CompensationController.getMyCompensationHistory);

// Admin Routes
router.use(requirePermission('settings:manage'));

// Components
router.get('/components', CompensationController.getComponents);
router.post('/components/seed-defaults', CompensationController.seedDefaultComponents);
router.post('/components', CompensationController.createComponent);
router.patch('/components/:id', CompensationController.updateComponent);

// Structures
router.get('/structures', CompensationController.getStructures);
router.post('/structures', CompensationController.createStructure);
router.patch('/structures/:id', CompensationController.updateStructure);

// Employee Compensation
router.get('/employees/:empId', CompensationController.getEmployeeCompensation);
router.post('/employees/:empId/revise', CompensationController.reviseEmployeeCompensation);
router.get('/employees/:empId/history', CompensationController.getEmployeeCompensationHistory);

export { router as compensationRouter };
