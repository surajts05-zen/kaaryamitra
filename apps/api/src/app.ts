import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import {
  globalRateLimiter,
  authRateLimiter,
  aiRateLimiter,
  tenantRateLimiter,
} from './middleware/rateLimiter.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/health.router.js';
import { authRouter } from './modules/auth/auth.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { orgRouter } from './modules/org/org.router.js';
import { employeesRouter } from './modules/employees/employees.router.js';
import { essRouter } from './modules/ess/ess.router.js';
import { billingRouter } from './modules/billing/billing.router.js';
import { adminBillingRouter } from './modules/billing/admin-billing.router.js';
import { razorpayWebhookRouter } from './modules/billing/razorpay-webhook.router.js';
import { initBillingMeterJob } from './jobs/billing-meter.job.js';
import { leaveRouter, essLeaveRouter, leaveApprovalsRouter } from './modules/leave/leave.router.js';
import { workflowRouter } from './modules/workflows/workflow.router.js';
import { rolesRouter } from './modules/roles/roles.router.js';
import { notificationsRouter } from './modules/notifications/notification.router.js';
import { meAttendanceRouter, adminAttendanceRouter } from './modules/attendance/attendance.router.js';
import { aiRouter } from './modules/ai/ai.router.js';
import { shiftsRouter } from './modules/shifts/shifts.router.js';
import { shiftSwapsRouter } from './modules/shifts/shift-swaps.router.js';
import { timesheetsRouter } from './modules/timesheets/timesheets.router.js';
import { documentsRouter } from './modules/documents/documents.router.js';
import { assetsRouter, employeeAssetsRouter } from './modules/assets/assets.router.js';
import { templatesRouter, employeeChecklistsRouter } from './modules/checklists/checklists.router.js';
import { resignationsRouter } from './modules/resignations/resignations.router.js';
import { holidaysRouter } from './modules/holidays/holidays.router.js';
import { helpdeskAdminRouter, helpdeskEssRouter } from './modules/helpdesk/helpdesk.router.js';
import { performanceRouter } from './modules/performance/performance.router.js';
import { dashboardRouter } from './modules/dashboard/dashboard.router.js';
import { compensationRouter } from './modules/compensation/compensation.router.js';
import { payrollRouter } from './modules/payroll/payroll.router.js';
import { policiesRouter } from './modules/policies/policies.router.js';
import { libraryRouter } from './modules/library/library.router.js';
import { reportsRouter } from './modules/reports/reports.router.js';
import { costCentersRouter } from './modules/cost-centers/cost-centers.router.js';
import { budgetCategoriesRouter } from './modules/budget-categories/budget-categories.router.js';
import { projectsRouter } from './modules/projects/projects.router.js';
import { budgetRequestsRouter } from './modules/budget-requests/budget-requests.router.js';
import { milestonesRouter } from './modules/milestones/milestones.router.js';
import { projectExpensesRouter } from './modules/project-expenses/project-expenses.router.js';
import { budgetAllocationsRouter } from './modules/budget-allocations/budget-allocations.router.js';
import { budgetDashboardRouter } from './modules/budget-dashboard/budget-dashboard.router.js';
import { apiKeysRouter } from './modules/api-keys/api-keys.router.js';
import { webhooksRouter } from './modules/webhooks/webhooks.router.js';
import { integrationsRouter } from './modules/integrations/integrations.router.js';
import { meetingsRouter } from './modules/meetings/meetings.router.js';
import { roomsRouter } from './modules/meetings/rooms.router.js';
import { meetingTypesRouter } from './modules/meetings/meeting-types.router.js';
import { openapiRouter } from './modules/openapi/openapi.router.js';
// Must be imported AFTER openapiRouter (which exports `registry`) so paths register correctly
import './modules/openapi/openapi.definitions.js';
import { requireAuth, requireSuperAdmin, requireApiKey, resolveTenant } from './middleware/auth.js';
import { requireFeature } from './middleware/billing.js';
import { queueMonitorRouter } from './modules/admin/queue-monitor.router.js';

export function createApp() {
  const app = express();

  // Initialize BullMQ jobs
  initBillingMeterJob();

  // ── Trust proxy (required for correct IP behind multiple Dokploy/Nginx reverse proxies) ─
  app.set('trust proxy', true);

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(
    helmet({
      // Full CSP enabled in production
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
      hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    }),
  );

  // ── Body parsers ─────────────────────────────────────────────────────────────
  
  // Razorpay webhooks require raw body for signature verification, must be mounted before json()
  app.use('/api/v1/webhooks/razorpay', razorpayWebhookRouter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // ── HTTP request logging ──────────────────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers.x-api-key'],
      customLogLevel: (_req: unknown, res: { statusCode: number }, err?: Error) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  // ── Rate limiting ──────────────────────────────────────────────────────────
  // Global fallback rate limiter (Redis-backed in production)
  app.use(globalRateLimiter);

  // Per-tenant rate limit applied after auth resolves tenantId
  // (mounted on individual route groups below where tenantId is known)

  // ── Routes ────────────────────────────────────────────────────────────────────

  // Health check (no auth required)
  app.use('/health', healthRouter);

  // Auth routes (rate limits are applied individually inside the router)
  app.use('/api/v1/auth', authRouter);

  // OpenAPI Docs
  app.use('/api/v1/docs', openapiRouter);

  // Generic Utility routes (no auth required for basic lookups)
  app.get('/api/v1/utils/ifsc/:code', async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      const response = await fetch(`https://ifsc.razorpay.com/${code}`);
      if (!response.ok) {
        return res.status(200).json({ success: false, error: 'IFSC not found' });
      }
      const data = await response.json();
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(200).json({ success: false, error: 'Failed to fetch IFSC' });
    }
  });

  // Tenant-scoped Org routes
  app.use('/api/v1/org', requireAuth, resolveTenant, requireFeature('core_hr'), orgRouter);
  app.use('/api/v1/t/:slug/org', requireAuth, resolveTenant, requireFeature('core_hr'), orgRouter);

  // Tenant-scoped Dashboard routes
  app.use('/api/v1/dashboard', requireAuth, resolveTenant, dashboardRouter);
  app.use('/api/v1/t/:slug/dashboard', requireAuth, resolveTenant, dashboardRouter);

  // Tenant-scoped Employees routes
  app.use('/api/v1/employees', requireAuth, resolveTenant, requireFeature('core_hr'), employeesRouter);
  app.use('/api/v1/t/:slug/employees', requireAuth, resolveTenant, requireFeature('core_hr'), employeesRouter);

  // Tenant-scoped Employee Self-Service (ESS) routes
  app.use('/api/v1/me', requireAuth, resolveTenant, essRouter);
  app.use('/api/v1/t/:slug/me', requireAuth, resolveTenant, essRouter);
  
  app.use('/api/v1/me/assets', requireAuth, resolveTenant, requireFeature('assets'), employeeAssetsRouter);
  app.use('/api/v1/t/:slug/me/assets', requireAuth, resolveTenant, requireFeature('assets'), employeeAssetsRouter);

  app.use('/api/v1/me/checklists', requireAuth, resolveTenant, requireFeature('core_hr'), employeeChecklistsRouter);
  app.use('/api/v1/t/:slug/me/checklists', requireAuth, resolveTenant, requireFeature('core_hr'), employeeChecklistsRouter);

  app.use('/api/v1/me/resignations', requireAuth, resolveTenant, requireFeature('core_hr'), resignationsRouter);
  app.use('/api/v1/t/:slug/me/resignations', requireAuth, resolveTenant, requireFeature('core_hr'), resignationsRouter);
  
  app.use('/api/v1/me/leave', requireAuth, resolveTenant, requireFeature('leave'), essLeaveRouter);
  app.use('/api/v1/t/:slug/me/leave', requireAuth, resolveTenant, requireFeature('leave'), essLeaveRouter);

  app.use('/api/v1/me/attendance', requireAuth, resolveTenant, requireFeature('attendance'), meAttendanceRouter);
  app.use('/api/v1/t/:slug/me/attendance', requireAuth, resolveTenant, requireFeature('attendance'), meAttendanceRouter);

  // Tenant-scoped Admin Attendance routes
  app.use('/api/v1/attendance', requireAuth, resolveTenant, requireFeature('attendance'), adminAttendanceRouter);
  app.use('/api/v1/t/:slug/attendance', requireAuth, resolveTenant, requireFeature('attendance'), adminAttendanceRouter);

  app.use('/api/v1/me/timesheets', requireAuth, resolveTenant, requireFeature('attendance'), timesheetsRouter);
  app.use('/api/v1/t/:slug/me/timesheets', requireAuth, resolveTenant, requireFeature('attendance'), timesheetsRouter);

  // Tenant-scoped Leave Admin routes
  app.use('/api/v1/leave', requireAuth, resolveTenant, requireFeature('leave'), leaveRouter);
  app.use('/api/v1/t/:slug/leave', requireAuth, resolveTenant, requireFeature('leave'), leaveRouter);

  // Tenant-scoped Approvals routes
  app.use('/api/v1/approvals/leave', requireAuth, resolveTenant, requireFeature('leave'), leaveApprovalsRouter);
  app.use('/api/v1/t/:slug/approvals/leave', requireAuth, resolveTenant, requireFeature('leave'), leaveApprovalsRouter);

  // Tenant-scoped Workflow routes
  app.use('/api/v1/workflows', requireAuth, resolveTenant, requireFeature('core_hr'), workflowRouter);
  app.use('/api/v1/t/:slug/workflows', requireAuth, resolveTenant, requireFeature('core_hr'), workflowRouter);

  // Tenant-scoped Roles / RBAC routes
  app.use('/api/v1/roles', requireAuth, resolveTenant, requireFeature('core_hr'), rolesRouter);
  app.use('/api/v1/t/:slug/roles', requireAuth, resolveTenant, requireFeature('core_hr'), rolesRouter);

  // Tenant-scoped AI routes (strict rate limit: 20 req/min)
  app.use('/api/v1/ai', requireAuth, resolveTenant, requireFeature('ai'), aiRateLimiter, aiRouter);
  app.use('/api/v1/t/:slug/ai', requireAuth, resolveTenant, requireFeature('ai'), aiRateLimiter, aiRouter);

  // Tenant-scoped Shifts routes
  app.use('/api/v1/shifts', requireAuth, resolveTenant, requireFeature('attendance'), shiftsRouter);
  app.use('/api/v1/t/:slug/shifts', requireAuth, resolveTenant, requireFeature('attendance'), shiftsRouter);
  app.use('/api/v1/shift-swaps', requireAuth, resolveTenant, requireFeature('attendance'), shiftSwapsRouter);
  app.use('/api/v1/t/:slug/shift-swaps', requireAuth, resolveTenant, requireFeature('attendance'), shiftSwapsRouter);

  // Tenant-scoped Documents routes
  app.use('/api/v1/documents', requireAuth, resolveTenant, requireFeature('core_hr'), documentsRouter);
  app.use('/api/v1/t/:slug/documents', requireAuth, resolveTenant, requireFeature('core_hr'), documentsRouter);

  // Tenant-scoped Assets routes
  app.use('/api/v1/assets', requireAuth, resolveTenant, requireFeature('assets'), assetsRouter);
  app.use('/api/v1/t/:slug/assets', requireAuth, resolveTenant, requireFeature('assets'), assetsRouter);

  // Tenant-scoped Checklists routes
  app.use('/api/v1/checklists', requireAuth, resolveTenant, requireFeature('core_hr'), templatesRouter);
  app.use('/api/v1/t/:slug/checklists', requireAuth, resolveTenant, requireFeature('core_hr'), templatesRouter);

  // Tenant-scoped Resignations routes
  app.use('/api/v1/resignations', requireAuth, resolveTenant, requireFeature('core_hr'), resignationsRouter);
  app.use('/api/v1/t/:slug/resignations', requireAuth, resolveTenant, requireFeature('core_hr'), resignationsRouter);

  // Tenant-scoped Holidays routes
  app.use('/api/v1/holidays', requireAuth, resolveTenant, requireFeature('core_hr'), holidaysRouter);
  app.use('/api/v1/t/:slug/holidays', requireAuth, resolveTenant, requireFeature('core_hr'), holidaysRouter);

  // Tenant-scoped Helpdesk routes
  app.use('/api/v1/t/:slug/helpdesk', requireAuth, resolveTenant, requireFeature('helpdesk'), helpdeskAdminRouter);
  app.use('/api/v1/t/:slug/me/helpdesk', requireAuth, resolveTenant, requireFeature('helpdesk'), helpdeskEssRouter);

  // Tenant-scoped Performance routes (admin/hr)
  app.use('/api/v1/t/:slug/performance', requireAuth, resolveTenant, requireFeature('performance'), performanceRouter);
  // Tenant-scoped Performance routes (ESS — me/performance/*)
  app.use('/api/v1/t/:slug/me/performance', requireAuth, resolveTenant, requireFeature('performance'), performanceRouter);

  // Tenant-scoped Compensation routes
  app.use('/api/v1/t/:slug/compensation', requireAuth, resolveTenant, requireFeature('payroll'), compensationRouter);

  // Tenant-scoped Payroll routes
  app.use('/api/v1/t/:slug/payroll', requireAuth, resolveTenant, requireFeature('payroll'), payrollRouter);

  // Tenant-scoped Policies routes
  app.use('/api/v1/t/:slug/policies', requireAuth, resolveTenant, requireFeature('library'), policiesRouter);

  // Tenant-scoped Library routes
  app.use('/api/v1/library', requireAuth, resolveTenant, requireFeature('library'), libraryRouter);
  app.use('/api/v1/t/:slug/library', requireAuth, resolveTenant, requireFeature('library'), libraryRouter);

  // Tenant-scoped Meetings & Calendar routes
  app.use('/api/v1/meetings', requireAuth, resolveTenant, requireFeature('core_hr'), meetingsRouter);
  app.use('/api/v1/t/:slug/meetings', requireAuth, resolveTenant, requireFeature('core_hr'), meetingsRouter);
  app.use('/api/v1/rooms', requireAuth, resolveTenant, requireFeature('core_hr'), roomsRouter);
  app.use('/api/v1/t/:slug/rooms', requireAuth, resolveTenant, requireFeature('core_hr'), roomsRouter);

  // Reports
  app.use('/api/v1/t/:slug/reports', requireAuth, resolveTenant, requireFeature('reports'), reportsRouter);

  // Tenant-scoped Projects & Budget Management
  app.use('/api/v1/cost-centers', requireAuth, resolveTenant, requireFeature('projects'), costCentersRouter);
  app.use('/api/v1/budget-categories', requireAuth, resolveTenant, requireFeature('projects'), budgetCategoriesRouter);
  app.use('/api/v1/projects', requireAuth, resolveTenant, requireFeature('projects'), projectsRouter);
  app.use('/api/v1/projects/:projectId/milestones', requireAuth, resolveTenant, requireFeature('projects'), milestonesRouter);
  app.use('/api/v1/projects/:projectId/allocations', requireAuth, resolveTenant, requireFeature('projects'), budgetAllocationsRouter);
  app.use('/api/v1/budget-requests', requireAuth, resolveTenant, requireFeature('projects'), budgetRequestsRouter);
  app.use('/api/v1/project-expenses', requireAuth, resolveTenant, requireFeature('projects'), projectExpensesRouter);
  app.use('/api/v1/budget-dashboard', requireAuth, resolveTenant, requireFeature('projects'), budgetDashboardRouter);

  // Maintain backward compatibility for /t/:slug prefixed URLs
  app.use('/api/v1/t/:slug/cost-centers', requireAuth, resolveTenant, requireFeature('projects'), costCentersRouter);
  app.use('/api/v1/t/:slug/budget-categories', requireAuth, resolveTenant, requireFeature('projects'), budgetCategoriesRouter);
  app.use('/api/v1/t/:slug/projects', requireAuth, resolveTenant, requireFeature('projects'), projectsRouter);
  app.use('/api/v1/t/:slug/projects/:projectId/milestones', requireAuth, resolveTenant, requireFeature('projects'), milestonesRouter);
  app.use('/api/v1/t/:slug/projects/:projectId/allocations', requireAuth, resolveTenant, requireFeature('projects'), budgetAllocationsRouter);
  app.use('/api/v1/t/:slug/budget-requests', requireAuth, resolveTenant, requireFeature('projects'), budgetRequestsRouter);
  app.use('/api/v1/t/:slug/project-expenses', requireAuth, resolveTenant, requireFeature('projects'), projectExpensesRouter);
  app.use('/api/v1/t/:slug/budget-dashboard', requireAuth, resolveTenant, requireFeature('projects'), budgetDashboardRouter);

  // API Keys routes
  app.use('/api/v1/api-keys', requireAuth, resolveTenant, requireFeature('developer'), apiKeysRouter);
  app.use('/api/v1/t/:slug/api-keys', requireAuth, resolveTenant, requireFeature('developer'), apiKeysRouter);

  // Webhooks routes
  app.use('/api/v1/webhooks', requireAuth, resolveTenant, requireFeature('developer'), webhooksRouter);
  app.use('/api/v1/t/:slug/webhooks', requireAuth, resolveTenant, requireFeature('developer'), webhooksRouter);

  // Integrations routes
  app.use('/api/v1/integrations', requireAuth, resolveTenant, requireFeature('developer'), integrationsRouter);
  app.use('/api/v1/t/:slug/integrations', requireAuth, resolveTenant, requireFeature('developer'), integrationsRouter);

  // Meetings & Calendar routes
  app.use('/api/v1/meetings', requireAuth, resolveTenant, requireFeature('core_hr'), meetingsRouter);
  app.use('/api/v1/t/:slug/meetings', requireAuth, resolveTenant, requireFeature('core_hr'), meetingsRouter);
  app.use('/api/v1/meeting-types', requireAuth, resolveTenant, meetingTypesRouter);
  app.use('/api/v1/t/:slug/meeting-types', requireAuth, resolveTenant, meetingTypesRouter);

  // Notifications (user-scoped, no tenant resolution needed — userId from JWT is enough)
  app.use('/api/v1/notifications', requireAuth, notificationsRouter);

  // Tenant-scoped routes — all under /api/v1/t/:slug/
  app.use('/api/v1/t/:slug/billing', requireAuth, resolveTenant, billingRouter);
  
  // Super Admin routes
  app.use('/api/v1/admin/billing', requireAuth, requireSuperAdmin, adminBillingRouter);
  app.use('/api/v1/admin/queues', requireAuth, requireSuperAdmin, queueMonitorRouter);
  app.use('/api/v1/admin', requireAuth, requireSuperAdmin, adminRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  // ── Global error handler (must be last) ──────────────────────────────────────
  app.use(errorHandler);

  return app;
}