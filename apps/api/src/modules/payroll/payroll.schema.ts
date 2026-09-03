import { z } from 'zod';

export const createPayrollRunSchema = z.object({
  name: z.string().min(2),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  frequency: z.enum(['MONTHLY', 'BI_WEEKLY', 'WEEKLY']),
  paymentDate: z.string().datetime(),
});

export const updatePayrollRunStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'REVIEW', 'APPROVED', 'FINALIZED', 'PAID']),
  notes: z.string().optional(),
});

export const createStatutoryRuleSchema = z.object({
  countryCode: z.string().min(2).toUpperCase().default('IN'),
  name: z.string().min(2),
  code: z.string().min(2).toUpperCase(),
  type: z.string().default('PERCENTAGE_OF_COMPONENT'),
  baseComponent: z.string().optional().nullable(),
  rateOrAmount: z.number().default(0),
  cappedAt: z.number().optional().nullable(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
});

export const updateStatutoryRuleSchema = createStatutoryRuleSchema.partial();
