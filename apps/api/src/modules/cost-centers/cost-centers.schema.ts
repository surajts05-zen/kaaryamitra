import { z } from 'zod';

export const costCenterSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateCostCenterSchema = costCenterSchema.partial();
