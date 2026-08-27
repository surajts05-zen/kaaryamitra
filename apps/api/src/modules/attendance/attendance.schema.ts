import { z } from 'zod';

export const LocationSchema = z.object({
  ipAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const CheckInSchema = z.object({
  body: LocationSchema,
});

export const CheckOutSchema = z.object({
  body: LocationSchema,
});

export const StartBreakSchema = z.object({
  body: z.object({
    type: z.string().optional(),
  }),
});

export const RegularizationSchema = z.object({
  body: z.object({
    date: z.string().datetime(),
    requestedCheckIn: z.string().datetime().optional(),
    requestedCheckOut: z.string().datetime().optional(),
    reason: z.string().min(5),
  }).refine(data => data.requestedCheckIn || data.requestedCheckOut, {
    message: "Must provide at least a requested check-in or check-out time",
    path: ["requestedCheckIn"]
  }),
});

export const AttendanceQuerySchema = z.object({
  query: z.object({
    month: z.string().regex(/^\d{1,2}$/, 'Invalid month').optional(),
    year: z.string().regex(/^\d{4}$/, 'Invalid year').optional(),
  }),
});
