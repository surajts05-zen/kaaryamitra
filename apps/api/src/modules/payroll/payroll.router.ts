import { Router } from 'express';
import { PayrollController } from './payroll.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router({ mergeParams: true });

router.use(requireAuth);

// ESS Routes (My Payslips) — available to all authenticated employees
router.get('/me/payslips', PayrollController.getMyPayslips);
router.get('/me/payslips/:id', PayrollController.getMyPayslipDetails);

// Admin Routes — HR Manager or Company Admin only
router.get('/runs', requireRole(['admin', 'hr', 'hr manager', 'company admin']), PayrollController.getRuns);
router.post('/runs', requireRole(['admin', 'hr', 'hr manager', 'company admin']), PayrollController.createRun);
router.get('/runs/:id', requireRole(['admin', 'hr', 'hr manager', 'company admin']), PayrollController.getRunDetails);
router.patch('/runs/:id/status', requireRole(['admin', 'hr', 'hr manager', 'company admin']), PayrollController.updateRunStatus);
router.post('/runs/:id/upload', requireRole(['admin', 'hr', 'hr manager', 'company admin']), upload.single('file'), PayrollController.uploadCsv);

// Statutory Rules
router.get('/statutory', requireRole(['admin', 'hr', 'hr manager', 'company admin']), PayrollController.getStatutoryRules);
router.post('/statutory', requireRole(['admin', 'hr', 'hr manager', 'company admin']), PayrollController.createStatutoryRule);
router.patch('/statutory/:id', requireRole(['admin', 'hr', 'hr manager', 'company admin']), PayrollController.updateStatutoryRule);

export { router as payrollRouter };
