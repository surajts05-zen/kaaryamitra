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

export const updatePlatformSettingsSchema = z.object({
  body: z.object({
    smtpHost: z.string().optional().nullable(),
    smtpPort: z.number().int().optional().nullable(),
    smtpUser: z.string().optional().nullable(),
    smtpPass: z.string().optional().nullable(),
    smtpFrom: z.string().optional().nullable(),
    geminiApiKey: z.string().optional().nullable(),
  }),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>['body'];
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>['body'];
export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>['body'];
