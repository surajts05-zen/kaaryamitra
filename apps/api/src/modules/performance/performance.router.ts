import { Router } from 'express';
import { PerformanceController } from './performance.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// ─── GOALS ──────────────────────────────────────────────────────────────────
router.post('/goals', requireRole(['admin', 'hr', 'manager']), PerformanceController.createGoal);
router.get('/goals', PerformanceController.getGoals);
router.get('/goals/:id', PerformanceController.getGoalById);
router.put('/goals/:id', requireRole(['admin', 'hr', 'manager']), PerformanceController.updateGoal);
router.delete('/goals/:id', requireRole(['admin', 'hr']), PerformanceController.deleteGoal);

// ─── REVIEW CYCLES (Admin) ──────────────────────────────────────────────────
router.post('/reviews/cycles', requireRole(['admin', 'hr']), PerformanceController.createReviewCycle);
router.get('/reviews/cycles', requireRole(['admin', 'hr']), PerformanceController.getReviewCycles);
router.get('/reviews/cycles/:id', requireRole(['admin', 'hr']), PerformanceController.getReviewCycleById);
router.post('/reviews/cycles/:id/start', requireRole(['admin', 'hr']), PerformanceController.startReviewCycle);

// ─── PERFORMANCE REVIEWS ────────────────────────────────────────────────────
// ESS / Managers
router.get('/me/reviews', PerformanceController.getMyReviews);
router.get('/me/team-reviews', requireRole(['manager']), PerformanceController.getTeamReviews);
router.get('/reviews/:id', PerformanceController.getReviewById);

// Submit Evaluations
router.post('/reviews/:id/self-evaluation', PerformanceController.submitSelfEvaluation);
router.post('/reviews/:id/manager-evaluation', requireRole(['manager', 'admin', 'hr']), PerformanceController.submitManagerEvaluation);
router.post('/reviews/:id/peer-feedback', PerformanceController.submitPeerFeedback);

// Finalize (HR)
router.post('/reviews/:id/finalize', requireRole(['admin', 'hr']), PerformanceController.finalizeReview);

export const performanceRouter = router;
