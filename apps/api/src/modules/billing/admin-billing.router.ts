/**
 * Admin Billing Router — Super Admin endpoints for billing configuration
 */
import { Router } from 'express';
import { z } from 'zod';
import { AdminBillingService } from './admin-billing.service.js';
import {
  updatePlanSchema,
  updateAddonSchema,
  updateRazorpaySettingsSchema,
} from './billing.schema.js';

export const adminBillingRouter = Router();

// ── Plans ────────────────────────────────────────────────────────────────────

adminBillingRouter.get('/plans', async (req, res, next) => {
  try {
    const plans = await AdminBillingService.getAllPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

adminBillingRouter.patch('/plans/:id', async (req, res, next) => {
  try {
    const input = updatePlanSchema.parse(req.body);
    const plan = await AdminBillingService.updatePlan(req.params.id, input);
    res.json({ success: true, data: plan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Invalid input', details: error.errors } });
    }
    next(error);
  }
});

// ── Addons ───────────────────────────────────────────────────────────────────

adminBillingRouter.get('/addons', async (req, res, next) => {
  try {
    const addons = await AdminBillingService.getAllAddons();
    res.json({ success: true, data: addons });
  } catch (error) {
    next(error);
  }
});

adminBillingRouter.patch('/addons/:id', async (req, res, next) => {
  try {
    const input = updateAddonSchema.parse(req.body);
    const addon = await AdminBillingService.updateAddon(req.params.id, input);
    res.json({ success: true, data: addon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Invalid input', details: error.errors } });
    }
    next(error);
  }
});

// ── Subscriptions Overview ───────────────────────────────────────────────────

adminBillingRouter.get('/subscriptions', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const status = req.query.status as string;
    const planSlug = req.query.planSlug as string;
    
    const result = await AdminBillingService.getAllSubscriptions({ page, limit, status, planSlug });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

adminBillingRouter.get('/subscriptions/:tenantId', async (req, res, next) => {
  try {
    const result = await AdminBillingService.getTenantSubscriptionDetail(req.params.tenantId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Admin override plan
adminBillingRouter.post('/subscriptions/:tenantId/override', async (req, res, next) => {
  try {
    const { planSlug, status } = req.body;
    const result = await AdminBillingService.adminChangeTenantPlan(req.params.tenantId, planSlug, status);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ── Invoices ─────────────────────────────────────────────────────────────────

adminBillingRouter.get('/invoices', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const status = req.query.status as string;
    const tenantId = req.query.tenantId as string;
    
    const result = await AdminBillingService.getAllInvoices({ page, limit, status, tenantId });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

adminBillingRouter.post('/invoices/:id/mark-paid', async (req, res, next) => {
  try {
    const { razorpayPaymentId } = req.body;
    const invoice = await AdminBillingService.adminMarkInvoicePaid(req.params.id, razorpayPaymentId);
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

// ── Platform Stats ───────────────────────────────────────────────────────────

adminBillingRouter.get('/stats', async (req, res, next) => {
  try {
    const stats = await AdminBillingService.getPlatformBillingStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// ── Razorpay Settings ────────────────────────────────────────────────────────

adminBillingRouter.get('/settings/razorpay', async (req, res, next) => {
  try {
    const settings = await AdminBillingService.getRazorpaySettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

adminBillingRouter.post('/settings/razorpay', async (req, res, next) => {
  try {
    const input = updateRazorpaySettingsSchema.parse(req.body);
    const result = await AdminBillingService.updateRazorpaySettings(input);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Invalid input', details: error.errors } });
    }
    next(error);
  }
});
