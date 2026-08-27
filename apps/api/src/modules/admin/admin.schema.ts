import { z } from 'zod';

export const createTenantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and dashes only'),
    plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).default('FREE'),
    adminEmail: z.string().email(),
    adminFirstName: z.string().min(1),
    adminLastName: z.string().min(1),
  }),
});

export const updateTenantSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  }),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>['body'];
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>['body'];
