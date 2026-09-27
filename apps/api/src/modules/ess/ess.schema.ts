import { z } from 'zod';

export const updateEssProfileSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    personalEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable().or(z.literal('')),
    avatarUrl: z.string().optional().nullable(),
    
    // Banking
    bankAccountName: z.string().optional().nullable(),
    bankAccountNumber: z.string().optional().nullable(),
    bankIfscCode: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    bankBranch: z.string().optional().nullable(),

    // Identity
    aadharNumber: z.string().optional().nullable(),
    panNumber: z.string().optional().nullable(),
    uanNumber: z.string().optional().nullable(),
    pfNumber: z.string().optional().nullable(),
  }),
});
