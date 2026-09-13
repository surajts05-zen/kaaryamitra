import { z } from 'zod';

export const budgetRequestLineSchema = z.object({
  categoryId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1).default(1),
  unitCost: z.number().min(0).default(0),
  capexOpex: z.enum(['CAPEX', 'OPEX']).default('OPEX'),
});

export const budgetRequestSchema = z.object({
  requestType: z.string().min(1, 'Request type is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  
  departmentId: z.string().optional(),
  costCenterId: z.string().optional(),
  projectId: z.string().optional(),
  periodId: z.string().optional(),
  
  objective: z.string().optional(),
  businessJustification: z.string().optional(),
  expectedOutcomes: z.string().optional(),
  risks: z.string().optional(),
  dependencies: z.string().optional(),
  
  lineItems: z.array(budgetRequestLineSchema).min(1, 'At least one line item is required'),
});

export const updateBudgetRequestSchema = budgetRequestSchema.partial();
