import { z } from 'zod';

export const CheckInSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationAccuracy: z.number().min(0).optional(),
    clientTimestamp: z.string().datetime().optional(),
    channel: z.enum(['DESKTOP', 'MOBILE', 'API']).optional(),
    deviceId: z.string().max(200).optional(),
    platform: z.string().max(100).optional(),
    transactionId: z.string().uuid().optional(),
    reason: z.string().max(500).optional(), // for early departure etc.
  }),
});

export const StartBreakSchema = z.object({
  body: z.object({
    type: z.string().optional().default('BREAK'),
  }),
});

export const RegularizationSchema = z.object({
  body: z.object({
    date: z.string(),
    requestedCheckIn: z.string().optional(),
    requestedCheckOut: z.string().optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
  }),
});

export const TrustedNetworkSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    cidr: z.string().regex(
      /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/,
      'Invalid CIDR format. Example: 203.0.113.0/24'
    ),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional().default(true),
  }),
});
