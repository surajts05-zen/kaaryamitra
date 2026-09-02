import { Request, Response } from 'express';
import { GoalsService } from './goals.service.js';
import { ReviewsService } from './reviews.service.js';
import { AppError } from '../../lib/errors.js';

export class PerformanceController {
  // ─── GOALS ──────────────────────────────────────────────────────────────────
  static async createGoal(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const goal = await GoalsService.createGoal(tenantId, req.body);
    res.status(201).json({ success: true, data: goal });
  }

  static async getGoals(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const goals = await GoalsService.getGoals(tenantId, req.query);
    res.json({ success: true, data: goals });
  }

  static async getGoalById(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const goal = await GoalsService.getGoalById(tenantId, req.params.id as string);
    res.json({ success: true, data: goal });
  }

  static async updateGoal(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const goal = await GoalsService.updateGoal(tenantId, req.params.id as string, req.body);
    res.json({ success: true, data: goal });
  }

  static async deleteGoal(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    await GoalsService.deleteGoal(tenantId, req.params.id as string);
    res.json({ success: true, message: 'Goal deleted successfully' });
  }

  // ─── REVIEW CYCLES (Admin) ──────────────────────────────────────────────────
  static async createReviewCycle(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const cycle = await ReviewsService.createReviewCycle(tenantId, req.body);
    res.status(201).json({ success: true, data: cycle });
  }

  static async getReviewCycles(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const cycles = await ReviewsService.getReviewCycles(tenantId);
    res.json({ success: true, data: cycles });
  }

  static async getReviewCycleById(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const cycle = await ReviewsService.getReviewCycleById(tenantId, req.params.id as string);
    res.json({ success: true, data: cycle });
  }

  static async startReviewCycle(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const cycle = await ReviewsService.startReviewCycle(tenantId, req.params.id as string);
    res.json({ success: true, data: cycle });
  }

  // ─── PERFORMANCE REVIEWS (ESS / MANAGER) ────────────────────────────────────
  static async getMyReviews(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.auth?.userId;
    if (!userId) throw AppError.unauthorized();
    const reviews = await ReviewsService.getMyReviews(tenantId, userId);
    res.json({ success: true, data: reviews });
  }

  static async getTeamReviews(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.auth?.userId;
    if (!userId) throw AppError.unauthorized();
    const reviews = await ReviewsService.getTeamReviews(tenantId, userId);
    res.json({ success: true, data: reviews });
  }

  static async getReviewById(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.auth?.userId;
    const isSuperAdmin = req.auth?.isSuperAdmin ?? false;
    // Treat super-admins and anyone with tenantId-level context as admin
    const role = isSuperAdmin ? 'admin' : '';
    if (!userId) throw AppError.unauthorized();

    const review = await ReviewsService.getReviewById(tenantId, req.params.id as string, userId, role);
    res.json({ success: true, data: review });
  }

  static async submitSelfEvaluation(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.auth?.userId;
    if (!userId) throw AppError.unauthorized();

    const review = await ReviewsService.submitSelfEvaluation(tenantId, req.params.id as string, userId, req.body);
    res.json({ success: true, data: review });
  }

  static async submitManagerEvaluation(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.auth?.userId;
    if (!userId) throw AppError.unauthorized();

    const review = await ReviewsService.submitManagerEvaluation(tenantId, req.params.id as string, userId, req.body);
    res.json({ success: true, data: review });
  }

  static async submitPeerFeedback(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.auth?.userId;
    if (!userId) throw AppError.unauthorized();

    const feedback = await ReviewsService.submitPeerFeedback(tenantId, req.params.id as string, userId, req.body);
    res.json({ success: true, data: feedback });
  }

  // ─── ADMIN OVERRIDES / HR REVIEW ──────────────────────────────────────────
  static async finalizeReview(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const review = await ReviewsService.finalizeReview(tenantId, req.params.id as string, req.body);
    res.json({ success: true, data: review });
  }
}
