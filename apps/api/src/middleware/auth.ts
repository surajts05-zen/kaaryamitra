import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import type { AuthTokenPayload, PermissionAction } from '@kaaryamitra/shared-types';

// ── Augment Express Request with auth context ─────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
      tenantId?: string;
      permissions?: string[];
    }
  }
}

// ── requireAuth — verifies access token from Authorization header ─────────────

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return next(AppError.unauthorized());
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;
    next();
  } catch (err) {
    next(err);
  }
}

// ── requireSuperAdmin — only platform super admins ────────────────────────────

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth?.isSuperAdmin) {
    return next(AppError.forbidden('Super Admin access required'));
  }
  next();
}

// ── resolveTenant — extracts tenant from /t/:slug/ path ──────────────────────

export async function resolveTenant(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const slugHeader = req.headers['x-tenant-slug'];
  const rawSlug = req.params['slug'] || (typeof slugHeader === 'string' ? slugHeader : undefined);
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (slug) {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { slug } });
      if (!tenant) return next(AppError.tenantNotFound(slug));
      if (tenant.status === 'SUSPENDED') return next(AppError.tenantSuspended());

      req.tenantId = tenant.id;

      if (req.auth && req.auth.tenantId && req.auth.tenantId !== tenant.id && !req.auth.isSuperAdmin) {
        return next(AppError.forbidden('You do not belong to this workspace'));
      }

      return next();
    } catch (err) {
      return next(err);
    }
  }

  // Fallback: If user JWT has tenantId attached
  if (req.auth?.tenantId) {
    req.tenantId = req.auth.tenantId;
    return next();
  }

  next();
}

// ── requirePermission — RBAC gate ────────────────────────────────────────────

export function requirePermission(...actions: PermissionAction[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) return next(AppError.unauthorized());

    // Super admins bypass all permission checks
    if (req.auth.isSuperAdmin) return next();

    try {
      // Fetch all permissions for this user (via their roles)
      const userPermissions = await prisma.permission.findMany({
        where: {
          rolePermissions: {
            some: {
              role: {
                userRoles: {
                  some: { userId: req.auth.userId },
                },
              },
            },
          },
        },
        select: { action: true },
      });

      const permSet = new Set(userPermissions.map((p) => p.action));
      const hasAll = actions.every((action) => permSet.has(action));

      if (!hasAll) {
        const missing = actions.filter((a) => !permSet.has(a));
        return next(AppError.insufficientPermission(missing.join(', ')));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ── hasPermission — programmatic check (use inside handlers) ─────────────────

export async function hasPermission(
  userId: string,
  action: PermissionAction,
  isSuperAdmin = false,
): Promise<boolean> {
  if (isSuperAdmin) return true;

  const permission = await prisma.permission.findFirst({
    where: {
      action,
      rolePermissions: {
        some: {
          role: {
            userRoles: { some: { userId } },
          },
        },
      },
    },
  });

  return permission !== null;
}
