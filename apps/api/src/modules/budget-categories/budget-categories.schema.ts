import { z } from 'zod';

export const budgetCategorySchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  capexOpex: z.enum(['CAPEX', 'OPEX']).default('OPEX'),
  isActive: z.boolean().default(true),
});

export const updateBudgetCategorySchema = budgetCategorySchema.partial();
