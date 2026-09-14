import { z } from 'zod';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';

export const configureIntegrationSchema = z.object({
  body: z.object({
    provider: z.nativeEnum(IntegrationProvider),
    config: z.record(z.string(), z.any()).default({}),
    secrets: z.record(z.string(), z.string()).optional(),
  }).refine((data) => {
    if (data.provider === 'SLACK') {
      return data.secrets?.botToken && data.config?.channelId;
    }
    if (data.provider === 'GOOGLE_WORKSPACE') {
      return !!data.secrets?.serviceAccountJson;
    }
    return true;
  }, {
    message: "Missing required configuration or secrets for the selected provider",
  }),
});

export const updateIntegrationStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(IntegrationStatus),
  }),
});
