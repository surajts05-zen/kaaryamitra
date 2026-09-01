import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const uploadDocumentSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  expiresAt: z.string().optional(), // ISO date string
});

export const uploadVersionSchema = z.object({
  changeNote: z.string().optional(),
});

export const verifyDocumentSchema = z.object({
  status: z.enum(['VALID', 'EXPIRED', 'ARCHIVED']),
});
