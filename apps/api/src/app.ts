import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/health.router.js';
import { authRouter } from './modules/auth/auth.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { orgRouter } from './modules/org/org.router.js';
import { employeesRouter } from './modules/employees/employees.router.js';
import { essRouter } from './modules/ess/ess.router.js';
import { leaveRouter, essLeaveRouter, leaveApprovalsRouter } from './modules/leave/leave.router.js';
import { workflowRouter } from './modules/workflows/workflow.router.js';
import { rolesRouter } from './modules/roles/roles.router.js';
import { notificationsRouter } from './modules/notifications/notification.router.js';
import { meAttendanceRouter } from './modules/attendance/attendance.router.js';
import { aiRouter } from './modules/ai/ai.router.js';
import { requireAuth, requireSuperAdmin, resolveTenant } from './middleware/auth.js';

export function createApp() {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Body parsers ─────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // ── HTTP request logging ──────────────────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      customLogLevel: (_req: unknown, res: { statusCode: number }, err?: Error) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  // ── Global rate limit ─────────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
    }),
  );

  // ── Routes ────────────────────────────────────────────────────────────────────

  // Health check (no auth required)
  app.use('/health', healthRouter);

  // Auth routes
  app.use('/api/v1/auth', authRouter);

  // Tenant-scoped Org routes
  app.use('/api/v1/org', requireAuth, resolveTenant, orgRouter);
  app.use('/api/v1/t/:slug/org', requireAuth, resolveTenant, orgRouter);

  // Tenant-scoped Employees routes
  app.use('/api/v1/employees', requireAuth, resolveTenant, employeesRouter);
  app.use('/api/v1/t/:slug/employees', requireAuth, resolveTenant, employeesRouter);

  // Tenant-scoped Employee Self-Service (ESS) routes
  app.use('/api/v1/me', requireAuth, resolveTenant, essRouter);
  app.use('/api/v1/t/:slug/me', requireAuth, resolveTenant, essRouter);
  
  app.use('/api/v1/me/leave', requireAuth, resolveTenant, essLeaveRouter);
  app.use('/api/v1/t/:slug/me/leave', requireAuth, resolveTenant, essLeaveRouter);

  app.use('/api/v1/me/attendance', requireAuth, resolveTenant, meAttendanceRouter);
  app.use('/api/v1/t/:slug/me/attendance', requireAuth, resolveTenant, meAttendanceRouter);

  // Tenant-scoped Leave Admin routes
  app.use('/api/v1/leave', requireAuth, resolveTenant, leaveRouter);
  app.use('/api/v1/t/:slug/leave', requireAuth, resolveTenant, leaveRouter);

  // Tenant-scoped Approvals routes
  app.use('/api/v1/approvals/leave', requireAuth, resolveTenant, leaveApprovalsRouter);
  app.use('/api/v1/t/:slug/approvals/leave', requireAuth, resolveTenant, leaveApprovalsRouter);

  // Tenant-scoped Workflow routes
  app.use('/api/v1/workflows', requireAuth, resolveTenant, workflowRouter);
  app.use('/api/v1/t/:slug/workflows', requireAuth, resolveTenant, workflowRouter);

  // Tenant-scoped Roles / RBAC routes
  app.use('/api/v1/roles', requireAuth, resolveTenant, rolesRouter);
  app.use('/api/v1/t/:slug/roles', requireAuth, resolveTenant, rolesRouter);

  // Tenant-scoped AI routes
  app.use('/api/v1/ai', requireAuth, resolveTenant, aiRouter);
  app.use('/api/v1/t/:slug/ai', requireAuth, resolveTenant, aiRouter);

  // Notifications (user-scoped, no tenant resolution needed — userId from JWT is enough)
  app.use('/api/v1/notifications', requireAuth, notificationsRouter);

  // Tenant-scoped routes — all under /api/v1/t/:slug/
  // Modules are registered as they are built in each phase:
  // app.use('/api/v1/t/:slug', requireAuth, resolveTenant, leaveRouter);
  // ...

  // Super Admin routes
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
