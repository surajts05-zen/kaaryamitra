import { Router } from 'express';
import { CompensationController } from './compensation.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// ESS Routes (My Compensation)
router.get('/me', CompensationController.getMyCompensation);
router.get('/me/history', CompensationController.getMyCompensationHistory);

// Admin Routes — HR Manager or Company Admin only
const adminRole = requireRole(['admin', 'hr', 'hr manager', 'company admin']);

// Components
router.get('/components', adminRole, CompensationController.getComponents);
router.post('/components/seed-defaults', adminRole, CompensationController.seedDefaultComponents);
router.post('/components', adminRole, CompensationController.createComponent);
router.patch('/components/:id', adminRole, CompensationController.updateComponent);

// Structures
router.get('/structures', adminRole, CompensationController.getStructures);
router.post('/structures', adminRole, CompensationController.createStructure);
router.patch('/structures/:id', adminRole, CompensationController.updateStructure);

// Employee Compensation
router.get('/employees/:empId', adminRole, CompensationController.getEmployeeCompensation);
router.post('/employees/:empId/revise', adminRole, CompensationController.reviseEmployeeCompensation);
router.get('/employees/:empId/history', adminRole, CompensationController.getEmployeeCompensationHistory);

export { router as compensationRouter };
