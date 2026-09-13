import { z } from 'zod';

export const budgetAllocationSchema = z.object({
  categoryId: z.string().optional(),
  milestoneId: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be positive'),
  currency: z.string().default('INR'),
});

export const updateBudgetAllocationSchema = budgetAllocationSchema.partial();
