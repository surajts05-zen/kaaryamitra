import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';

export function requireRole(allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) return next(AppError.unauthorized());
      if (req.auth.isSuperAdmin) return next();

      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.auth.userId },
        include: { role: true }
      });

      // We normalize names to lowercase for checking, e.g. 'admin', 'hr', 'manager'
      const hasRole = userRoles.some(ur => {
        const roleName = ur.role.name.toLowerCase();
        return allowedRoles.includes(roleName) || ur.role.name === 'Company Admin';
      });

      if (!hasRole) {
        return next(AppError.forbidden('Insufficient role access for this action.'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
