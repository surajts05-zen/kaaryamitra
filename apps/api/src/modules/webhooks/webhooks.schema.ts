import { z } from 'zod';
import { WebhookEventType } from '@prisma/client';

export const createWebhookSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    url: z.string().url(),
    events: z.array(z.nativeEnum(WebhookEventType)).min(1),
    headers: z.record(z.string(), z.string()).optional(),
  }),
});

export const updateWebhookSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    url: z.string().url().optional(),
    events: z.array(z.nativeEnum(WebhookEventType)).min(1).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});
