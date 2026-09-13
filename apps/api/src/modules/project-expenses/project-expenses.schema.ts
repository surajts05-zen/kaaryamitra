import { z } from 'zod';

export const projectExpenseSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  milestoneId: z.string().optional(),
  categoryId: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be positive'),
  currency: z.string().default('INR'),
  date: z.string(), // ISO date string
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const updateProjectExpenseSchema = projectExpenseSchema.partial().extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
});
