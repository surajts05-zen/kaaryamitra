import { z } from 'zod';

export const projectSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  managerId: z.string().optional(),
  departmentId: z.string().optional(),
  costCenterId: z.string().optional(),
  client: z.string().optional(),
  startDate: z.string().optional(), // ISO date string
  plannedEndDate: z.string().optional(),
  status: z.enum(['PLANNING', 'PROPOSED', 'APPROVED', 'ACTIVE', 'ON_HOLD', 'AT_RISK', 'COMPLETED', 'CANCELLED', 'CLOSED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

export const updateProjectSchema = projectSchema.partial();

export const projectMemberSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  role: z.string().min(1, 'Role is required'),
  allocationPct: z.number().min(1).max(100).default(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  billingRate: z.number().optional(),
});
