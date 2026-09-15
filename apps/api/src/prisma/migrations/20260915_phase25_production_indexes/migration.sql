-- Phase 25: Production Hardening — Missing Composite Indexes
-- These indexes target the most common multi-tenant query patterns
-- to prevent sequential scans on large tables.

-- ─── employees ───────────────────────────────────────────────────────────────
-- Used by: payroll calculations, billing meter, employee count queries
CREATE INDEX IF NOT EXISTS "employees_tenantId_employmentStatus_idx"
  ON "employees" ("tenantId", "employmentStatus");

-- Used by: employee directory listing, search with status filter
CREATE INDEX IF NOT EXISTS "employees_tenantId_userId_idx"
  ON "employees" ("tenantId", "userId");

-- ─── leave_applications ───────────────────────────────────────────────────────
-- Used by: leave calendar, manager approval dashboard, leave reports
CREATE INDEX IF NOT EXISTS "leave_applications_tenantId_status_idx"
  ON "leave_applications" ("tenantId", "status");

-- Used by: payroll LOP calculation (date range queries)
CREATE INDEX IF NOT EXISTS "leave_applications_tenantId_startDate_endDate_idx"
  ON "leave_applications" ("tenantId", "startDate", "endDate");

-- Used by: employee self-service leave history
CREATE INDEX IF NOT EXISTS "leave_applications_employeeId_status_idx"
  ON "leave_applications" ("employeeId", "status");

-- ─── audit_logs ───────────────────────────────────────────────────────────────
-- Used by: admin audit trail views, compliance reports
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_createdAt_idx"
  ON "audit_logs" ("tenantId", "createdAt" DESC);

-- ─── workflow_instances ───────────────────────────────────────────────────────
-- Used by: approval dashboard, pending items count, escalation job
CREATE INDEX IF NOT EXISTS "workflow_instances_tenantId_status_idx"
  ON "workflow_instances" ("tenantId", "status");

-- ─── webhook_deliveries ───────────────────────────────────────────────────────
-- Used by: webhook retry job (primary query every 5 minutes)
CREATE INDEX IF NOT EXISTS "webhook_deliveries_status_nextRetryAt_idx"
  ON "webhook_deliveries" ("status", "nextRetryAt")
  WHERE "status" = 'RETRYING';

-- ─── sessions ────────────────────────────────────────────────────────────────
-- Used by: session cleanup, refresh token lookup
CREATE INDEX IF NOT EXISTS "sessions_expiresAt_revokedAt_idx"
  ON "sessions" ("expiresAt", "revokedAt")
  WHERE "revokedAt" IS NULL;

-- ─── notifications ────────────────────────────────────────────────────────────
-- Used by: unread notification count, notification center
CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_createdAt_idx"
  ON "notifications" ("userId", "isRead", "createdAt" DESC);

-- ─── documents ────────────────────────────────────────────────────────────────
-- Used by: document expiry job (daily scan)
CREATE INDEX IF NOT EXISTS "documents_status_expiresAt_idx"
  ON "documents" ("status", "expiresAt")
  WHERE "expiresAt" IS NOT NULL;

-- Used by: employee document list
CREATE INDEX IF NOT EXISTS "documents_tenantId_employeeId_idx"
  ON "documents" ("tenantId", "employeeId");

-- ─── attendance_records ───────────────────────────────────────────────────────
-- Used by: attendance reports, payroll calculation
CREATE INDEX IF NOT EXISTS "attendance_records_tenantId_date_idx"
  ON "attendance_records" ("tenantId", "date" DESC);
