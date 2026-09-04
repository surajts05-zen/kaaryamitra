import { z } from 'zod';

export const createPolicyCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional()
});

export const updatePolicyCategorySchema = createPolicyCategorySchema.partial();

export const createPolicySchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  requiresAck: z.boolean().default(false)
});

export const updatePolicySchema = z.object({
  categoryId: z.string().optional(),
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  requiresAck: z.boolean().optional()
});

// JSON Block Validator
const blockSchema = z.object({
  id: z.string(),
  type: z.enum(['heading', 'paragraph', 'alert', 'faq', 'list']),
  content: z.string().optional(),
  question: z.string().optional(), // For FAQ
  answer: z.string().optional(), // For FAQ
  variant: z.enum(['default', 'destructive']).optional(), // For alert
  items: z.array(z.string()).optional() // For list
}).passthrough();

export const updatePolicyVersionSchema = z.object({
  blocks: z.array(blockSchema)
});
