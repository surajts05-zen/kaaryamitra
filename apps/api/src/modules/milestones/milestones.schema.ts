import { z } from 'zod';

export const milestoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  plannedBudget: z.number().min(0).default(0),
  actualCost: z.number().min(0).optional(),
});

export const updateMilestoneSchema = milestoneSchema.partial().extend({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED', 'DELAYED', 'CANCELLED']).optional(),
  completionPct: z.number().min(0).max(100).optional(),
  actualCost: z.number().min(0).optional(),
});
