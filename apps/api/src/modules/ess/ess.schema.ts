import { z } from 'zod';

export const updateEssProfileSchema = z.object({
  body: z.object({
    personalEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
  }),
});
