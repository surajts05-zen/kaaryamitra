import { Router } from 'express';
import { PoliciesController } from './policies.controller.js';
import { requireRole } from '../../middleware/role.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = Router({ mergeParams: true });

// ESS Routes (For all employees)
router.get('/me', asyncHandler(PoliciesController.getMyPolicies));
router.post('/me/:versionId/acknowledge', asyncHandler(PoliciesController.acknowledgePolicy));

// Admin Routes
const adminRole = requireRole(['admin', 'hr', 'company admin', 'super admin']);

// Categories
router.get('/categories', adminRole, asyncHandler(PoliciesController.getCategories));
router.post('/categories', adminRole, asyncHandler(PoliciesController.createCategory));
router.put('/categories/:id', adminRole, asyncHandler(PoliciesController.updateCategory));
router.delete('/categories/:id', adminRole, asyncHandler(PoliciesController.deleteCategory));

// Policies
router.get('/', adminRole, asyncHandler(PoliciesController.getPolicies));
router.post('/', adminRole, asyncHandler(PoliciesController.createPolicy));
router.get('/:id', adminRole, asyncHandler(PoliciesController.getPolicy));
router.put('/:id', adminRole, asyncHandler(PoliciesController.updatePolicy));

// Versions
router.post('/:id/versions', adminRole, asyncHandler(PoliciesController.createDraftVersion));
router.get('/:id/versions/:versionId', adminRole, asyncHandler(PoliciesController.getVersion));
router.put('/:id/versions/:versionId', adminRole, asyncHandler(PoliciesController.saveDraftVersion));
router.post('/:id/versions/:versionId/submit-review', adminRole, asyncHandler(PoliciesController.submitForReview));
router.post('/:id/versions/:versionId/publish', adminRole, asyncHandler(PoliciesController.publishVersion));
// Templates & AI Assist
router.post('/seed-templates', adminRole, asyncHandler(PoliciesController.seedTemplates));
router.post('/ai-generate', adminRole, asyncHandler(PoliciesController.aiGenerate));
router.post('/ai-refine', adminRole, asyncHandler(PoliciesController.aiRefine));
router.post('/:id/versions/:versionId/ai-summarize', adminRole, asyncHandler(PoliciesController.aiSummarize));
router.post('/:id/versions/:versionId/ai-faq', adminRole, asyncHandler(PoliciesController.aiGenerateFAQ));
router.post('/:id/compare', adminRole, asyncHandler(PoliciesController.aiCompare));
router.post('/:id/versions/:versionId/ai-draft-comm', adminRole, asyncHandler(PoliciesController.aiDraftComm));

export { router as policiesRouter };


