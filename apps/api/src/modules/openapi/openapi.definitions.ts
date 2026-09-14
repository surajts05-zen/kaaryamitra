/**
 * openapi.definitions.ts
 * 
 * Registers all KaaryaMitra API endpoints with the OpenAPI registry so Swagger UI
 * renders them correctly. Import this file in app.ts BEFORE the openapiRouter is mounted.
 */
import { registry } from './openapi.router.js';
import { z } from 'zod';

const tenantParam = {
  in: 'path' as const,
  name: 'slug',
  required: true,
  schema: { type: 'string' as const },
  description: 'Tenant slug (workspace identifier)',
};

const idParam = {
  in: 'path' as const,
  name: 'id',
  required: true,
  schema: { type: 'string' as const },
  description: 'Resource ID',
};

const successResponse = (description: string, dataSchema?: z.ZodTypeAny) => ({
  200: {
    description,
    content: {
      'application/json': {
        schema: z.object({
          success: z.boolean(),
          data: dataSchema ?? z.any(),
        }),
      },
    },
  },
});

// ─── API KEYS ────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/t/{slug}/api-keys',
  tags: ['API Keys'],
  summary: 'List all API keys for the tenant',
  parameters: [tenantParam],
  responses: successResponse('List of API keys'),
});

registry.registerPath({
  method: 'post',
  path: '/t/{slug}/api-keys',
  tags: ['API Keys'],
  summary: 'Generate a new API key',
  parameters: [tenantParam],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).describe('Human-friendly name for the key'),
            scopes: z.array(z.string()).optional().describe('Permission scopes'),
            expiresAt: z.string().optional().describe('ISO 8601 expiry date'),
          }),
        },
      },
    },
  },
  responses: successResponse('Generated API key (rawKey shown only once)'),
});

registry.registerPath({
  method: 'delete',
  path: '/t/{slug}/api-keys/{id}',
  tags: ['API Keys'],
  summary: 'Delete (revoke) an API key permanently',
  parameters: [tenantParam, idParam],
  responses: successResponse('API key deleted'),
});

// ─── WEBHOOKS ────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/t/{slug}/webhooks',
  tags: ['Webhooks'],
  summary: 'List all webhook endpoints for the tenant',
  parameters: [tenantParam],
  responses: successResponse('List of webhook endpoints'),
});

registry.registerPath({
  method: 'post',
  path: '/t/{slug}/webhooks',
  tags: ['Webhooks'],
  summary: 'Create a new webhook endpoint',
  parameters: [tenantParam],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1),
            url: z.string().url(),
            events: z.array(z.enum([
              'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_OFFBOARDED',
              'LEAVE_APPROVED', 'LEAVE_REJECTED', 'PAYROLL_FINALIZED',
              'ATTENDANCE_MARKED', 'RESIGNATION_SUBMITTED', 'CUSTOM',
            ])),
            headers: z.record(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: successResponse('Created webhook endpoint (includes signing secret shown once)'),
});

registry.registerPath({
  method: 'post',
  path: '/t/{slug}/webhooks/{id}/test',
  tags: ['Webhooks'],
  summary: 'Send a test payload to the webhook URL',
  parameters: [tenantParam, idParam],
  responses: successResponse('Test delivery result'),
});

registry.registerPath({
  method: 'delete',
  path: '/t/{slug}/webhooks/{id}',
  tags: ['Webhooks'],
  summary: 'Delete a webhook endpoint',
  parameters: [tenantParam, idParam],
  responses: successResponse('Webhook deleted'),
});

// ─── INTEGRATIONS ────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/t/{slug}/integrations',
  tags: ['Integrations'],
  summary: 'List all configured integrations for the tenant',
  parameters: [tenantParam],
  responses: successResponse('List of integrations'),
});

registry.registerPath({
  method: 'post',
  path: '/t/{slug}/integrations',
  tags: ['Integrations'],
  summary: 'Configure a new third-party integration',
  parameters: [tenantParam],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            provider: z.enum([
              'GOOGLE_WORKSPACE', 'MICROSOFT_365', 'SLACK', 'TEAMS',
              'GREYTHR', 'KEKA', 'TALLY', 'QUICKBOOKS', 'ZOHO_BOOKS',
              'BIOMETRIC_ZKTIME', 'GOOGLE_CALENDAR', 'OUTLOOK_CALENDAR',
            ]),
            config: z.record(z.any()).describe('Provider-specific configuration (non-secret)'),
            secrets: z.record(z.string()).optional().describe('Provider-specific secrets (encrypted at rest)'),
          }),
        },
      },
    },
  },
  responses: successResponse('Configured integration'),
});

registry.registerPath({
  method: 'delete',
  path: '/t/{slug}/integrations/{id}',
  tags: ['Integrations'],
  summary: 'Disconnect and remove an integration',
  parameters: [tenantParam, idParam],
  responses: successResponse('Integration disconnected'),
});

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/t/{slug}/employees',
  tags: ['Employees'],
  summary: 'List all employees in the tenant',
  parameters: [tenantParam],
  responses: successResponse('Paginated employee list'),
});

registry.registerPath({
  method: 'get',
  path: '/t/{slug}/employees/{id}',
  tags: ['Employees'],
  summary: 'Get a single employee profile',
  parameters: [tenantParam, idParam],
  responses: successResponse('Employee profile'),
});

// ─── LEAVE ───────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/t/{slug}/leave/requests',
  tags: ['Leave'],
  summary: 'List leave requests (admin view)',
  parameters: [tenantParam],
  responses: successResponse('List of leave requests'),
});

registry.registerPath({
  method: 'post',
  path: '/t/{slug}/leave/requests',
  tags: ['Leave'],
  summary: 'Submit a new leave request',
  parameters: [tenantParam],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            leaveTypeId: z.string(),
            startDate: z.string(),
            endDate: z.string(),
            reason: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: successResponse('Created leave request'),
});

// ─── PAYROLL ─────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/t/{slug}/payroll/runs',
  tags: ['Payroll'],
  summary: 'List all payroll runs',
  parameters: [tenantParam],
  responses: successResponse('List of payroll runs'),
});

registry.registerPath({
  method: 'post',
  path: '/t/{slug}/payroll/runs',
  tags: ['Payroll'],
  summary: 'Create and run a new payroll',
  parameters: [tenantParam],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            month: z.number().int().min(1).max(12),
            year: z.number().int().min(2000),
          }),
        },
      },
    },
  },
  responses: successResponse('Created payroll run'),
});
