import { z } from 'zod';

// ─── Plan Management ─────────────────────────────────────────────────────────

export const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  monthlyPriceInr: z.number().min(0).optional(),
  monthlyPriceUsd: z.number().min(0).optional(),
  annualDiscountPct: z.number().min(0).max(100).optional(),
  maxEmployees: z.number().int().positive().nullable().optional(),
  maxStorageMb: z.number().int().positive().nullable().optional(),
  maxApiCallsPerMonth: z.number().int().positive().nullable().optional(),
  employeeOverageRateInr: z.number().min(0).nullable().optional(),
  employeeOverageRateUsd: z.number().min(0).nullable().optional(),
  trialDays: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  razorpayMonthlyPlanId: z.string().optional().nullable(),
  razorpayAnnualPlanId: z.string().optional().nullable(),
  modules: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

// ─── Add-on Management ───────────────────────────────────────────────────────

export const updateAddonSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  monthlyPriceInr: z.number().min(0).optional(),
  monthlyPriceUsd: z.number().min(0).optional(),
  razorpayMonthlyPlanId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdateAddonInput = z.infer<typeof updateAddonSchema>;

// ─── Subscription Management ─────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  planSlug: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).default('MONTHLY'),
  currency: z.enum(['INR', 'USD']).default('INR'),
  addonKeys: z.array(z.string()).default([]),
  customerEmail: z.string().email().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const changePlanSchema = z.object({
  planSlug: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).optional(),
});

export type ChangePlanInput = z.infer<typeof changePlanSchema>;

export const toggleAddonSchema = z.object({
  addonKey: z.string().min(1),
  enabled: z.boolean(),
});

export type ToggleAddonInput = z.infer<typeof toggleAddonSchema>;

// ─── Razorpay webhook ────────────────────────────────────────────────────────

export const razorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.record(z.any()),
});

// ─── Invoice Management ──────────────────────────────────────────────────────

export const markInvoicePaidSchema = z.object({
  razorpayPaymentId: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});

export type MarkInvoicePaidInput = z.infer<typeof markInvoicePaidSchema>;

// ─── Platform Settings (Razorpay) ────────────────────────────────────────────

export const updateRazorpaySettingsSchema = z.object({
  razorpayKeyId: z.string().min(1),
  razorpayKeySecret: z.string().min(1),
  razorpayWebhookSecret: z.string().optional(),
});

export type UpdateRazorpaySettingsInput = z.infer<typeof updateRazorpaySettingsSchema>;
