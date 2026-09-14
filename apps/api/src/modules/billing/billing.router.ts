/**
 * Billing Router — Company Admin tenant-scoped billing routes
 */
import { Router } from 'express';
import { z } from 'zod';
import { BillingService } from './billing.service.js';
import {
  createSubscriptionSchema,
  changePlanSchema,
  toggleAddonSchema,
} from './billing.schema.js';
import { AppError } from '../../lib/errors.js';

export const billingRouter = Router();

// Helper to extract tenantId from request context
function getTenantId(req: any): string {
  const tenantId = req.tenantId || req.tenant?.id;
  if (!tenantId) {
    throw AppError.badRequest('Tenant context required');
  }
  return tenantId;
}

// GET /api/v1/t/:slug/billing/plans
// Get all available plans and addons
billingRouter.get('/plans', async (req, res, next) => {
  try {
    const plans = await BillingService.getPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/t/:slug/billing/subscription
// Get current tenant's subscription + usage
billingRouter.get('/subscription', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const [sub, usage] = await Promise.all([
      BillingService.getTenantSubscription(tenantId),
      BillingService.getUsageSummary(tenantId),
    ]);
    res.json({ success: true, data: { subscription: sub, usage } });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/t/:slug/billing/subscription
// Create or upgrade a subscription (with Razorpay checkout)
billingRouter.post('/subscription', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const input = createSubscriptionSchema.parse(req.body);
    const result = await BillingService.createOrUpgradeSubscription(tenantId, input);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Invalid input', details: error.errors } });
    }
    next(error);
  }
});

// PATCH /api/v1/t/:slug/billing/subscription/plan
// Change base plan
billingRouter.patch('/subscription/plan', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const input = changePlanSchema.parse(req.body);
    const result = await BillingService.changePlan(tenantId, input);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Invalid input', details: error.errors } });
    }
    next(error);
  }
});

// POST /api/v1/t/:slug/billing/subscription/addons
// Toggle an addon
billingRouter.post('/subscription/addons', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const input = toggleAddonSchema.parse(req.body);
    const result = await BillingService.toggleAddon(tenantId, input);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Invalid input', details: error.errors } });
    }
    next(error);
  }
});

// DELETE /api/v1/t/:slug/billing/subscription
// Cancel subscription
billingRouter.delete('/subscription', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const atPeriodEnd = req.body.atPeriodEnd ?? true;
    const result = await BillingService.cancelSubscription(tenantId, atPeriodEnd);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/t/:slug/billing/invoices
// List tenant invoices
billingRouter.get('/invoices', async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await BillingService.getInvoices(tenantId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
