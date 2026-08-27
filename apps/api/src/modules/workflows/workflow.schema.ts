import { z } from 'zod';

// ─── Workflow Step Definition (stored as JSON in WorkflowTemplate.steps) ─────

export const WorkflowStepDefSchema = z.object({
  stepOrder: z.number().int().min(1),
  label: z.string().min(1, 'Step label is required'),
  assigneeType: z.enum(['MANAGER', 'DEPARTMENT_HEAD', 'ROLE', 'SPECIFIC_USER', 'HR']),
  assigneeId: z.string().optional(), // Required when assigneeType = ROLE | SPECIFIC_USER
});

export type WorkflowStepDef = z.infer<typeof WorkflowStepDefSchema>;

// ─── Workflow Template Schemas ────────────────────────────────────────────────

export const CreateWorkflowTemplateSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  triggerType: z.enum(['LEAVE_REQUEST', 'EXPENSE_REQUEST', 'OFFBOARDING_REQUEST', 'DOCUMENT_REQUEST', 'CUSTOM']),
  steps: z.array(WorkflowStepDefSchema).min(1, 'At least one step is required'),
});

export const UpdateWorkflowTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  steps: z.array(WorkflowStepDefSchema).min(1).optional(),
});

// ─── Workflow Action (Approve / Reject) ────────────────────────────────────────

export const WorkflowActionSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});
