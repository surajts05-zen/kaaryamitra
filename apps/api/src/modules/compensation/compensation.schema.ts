import { z } from 'zod';

export const createSalaryComponentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).toUpperCase(),
  type: z.enum(['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION', 'EMPLOYEE_CONTRIBUTION']),
  frequency: z.enum(['MONTHLY', 'ANNUAL', 'ONE_TIME']).optional().default('MONTHLY'),
  isTaxable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
  description: z.string().optional(),
});

export const updateSalaryComponentSchema = createSalaryComponentSchema.partial();

export const salaryStructureItemSchema = z.object({
  componentId: z.string(),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
  value: z.number().nonnegative(),
  percentageBase: z.string().optional(),
  formula: z.string().optional(),
});

export const createSalaryStructureSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  items: z.array(salaryStructureItemSchema).min(1),
});

export const updateSalaryStructureSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  items: z.array(salaryStructureItemSchema).optional(),
});

export const reviseCompensationSchema = z.object({
  structureId: z.string().optional(),
  effectiveFrom: z.string().datetime(),
  annualCTC: z.number().positive(),
  monthlyGross: z.number().positive(),
  reason: z.string().min(5),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  accountType: z.string().optional(),
  items: z.array(z.object({
    componentId: z.string(),
    amount: z.number().nonnegative(),
  })).min(1),
});
