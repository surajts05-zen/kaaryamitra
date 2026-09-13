import { z } from 'zod';

export const updateEssProfileSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    personalEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable().or(z.literal('')),
    avatarUrl: z.string().optional().nullable(),
  }),
});
