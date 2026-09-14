import { z } from 'zod';

export const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    scopes: z.array(z.string()).default([]),
    expiresAt: z.string().datetime().optional().nullable(),
  }),
});

export const updateApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    scopes: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    status: z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']).optional(),
  }),
});
