import { prisma } from './prisma.js';
import type { Request } from 'express';
import { logger } from './logger.js';

interface AuditOptions {
  req: Request;
  action: string;       // e.g. 'employee.created'
  entityType: string;   // e.g. 'Employee'
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/**
 * Record an immutable audit log entry.
 * Call this after every state-changing operation.
 */
export async function audit(options: AuditOptions): Promise<void> {
  const { req, action, entityType, entityId, before, after } = options;

  if (!req.auth) {
    logger.warn({ action, entityType, entityId }, 'Audit called without authenticated user');
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenantId ?? null,
        actorId: req.auth.userId,
        actorEmail: req.auth.email,
        action,
        entityType,
        entityId,
        before: (before ?? undefined) as any,
        after: (after ?? undefined) as any,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });
  } catch (err) {
    // Audit failures should never crash the app — log and continue
    logger.error({ err, action, entityType, entityId }, 'Failed to write audit log');
  }
}
