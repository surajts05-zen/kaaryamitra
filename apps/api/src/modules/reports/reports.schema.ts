import { z } from 'zod';

export const FilterRuleSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'in', 'notIn', 'notEquals']),
  value: z.any()
});

export const ReportConfigSchema = z.object({
  fields: z.array(z.string()),
  filters: z.array(FilterRuleSchema).optional(),
  groupBys: z.array(z.string()).optional(),
  sortBys: z.array(z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc'])
  })).optional(),
  chartType: z.enum(['TABLE', 'BAR', 'PIE', 'LINE']).optional().default('TABLE')
});

export const ExecuteQuerySchema = z.object({
  dataset: z.string(),
  config: ReportConfigSchema
});

export const CreateSavedReportSchema = ExecuteQuerySchema.extend({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isScheduled: z.boolean().optional(),
  cronSchedule: z.string().optional(),
  emails: z.string().optional()
});

export const UpdateSavedReportSchema = CreateSavedReportSchema.partial();
