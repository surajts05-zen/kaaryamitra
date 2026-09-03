import { Router } from 'express';
import { PayrollController } from './payroll.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router({ mergeParams: true });

router.use(requireAuth);

// ESS Routes (My Payslips)
router.get('/me/payslips', PayrollController.getMyPayslips);
router.get('/me/payslips/:id', PayrollController.getMyPayslipDetails);

// Admin Routes
router.use(requirePermission('settings:manage'));

router.get('/runs', PayrollController.getRuns);
router.post('/runs', PayrollController.createRun);
router.get('/runs/:id', PayrollController.getRunDetails);
router.patch('/runs/:id/status', PayrollController.updateRunStatus);
router.post('/runs/:id/upload', upload.single('file'), PayrollController.uploadCsv);

// Statutory Rules
router.get('/statutory', PayrollController.getStatutoryRules);
router.post('/statutory', PayrollController.createStatutoryRule);
router.patch('/statutory/:id', PayrollController.updateStatutoryRule);

export { router as payrollRouter };
