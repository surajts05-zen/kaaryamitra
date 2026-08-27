import { z } from 'zod';

export const CreateLeaveTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').toUpperCase(),
  color: z.string().optional(),
  isPaid: z.boolean().optional(),
  description: z.string().optional(),
  daysPerYear: z.number().min(0).default(0),
  accrualFrequency: z.enum(['YEARLY', 'MONTHLY']).default('YEARLY'),
  isCarryForwardAllowed: z.boolean().default(false),
  maxCarryForward: z.number().min(0).default(0),
});

export const UpdateLeaveTypeSchema = CreateLeaveTypeSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const CreateLeaveApplicationSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave Type is required'),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  reason: z.string().optional(),
}).refine(data => {
  if (data.isHalfDay && !data.halfDayPeriod) {
    return false;
  }
  return true;
}, {
  message: "halfDayPeriod is required when isHalfDay is true",
  path: ["halfDayPeriod"]
});

export const ReviewLeaveApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  managerNote: z.string().optional(),
});
