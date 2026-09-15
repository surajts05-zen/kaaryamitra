import { Request, Response, NextFunction } from 'express';
import { BillingService, ModuleKey } from '../modules/billing/billing.service.js';

export const requireFeature = (moduleKey: ModuleKey) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const hasAccess = await BillingService.checkFeatureAccess(tenantId, moduleKey);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FEATURE_NOT_ENABLED',
            message: `The '${moduleKey}' feature is not enabled on your current plan. Please upgrade your plan or purchase the add-on to access this feature.`,
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const enforceEmployeeLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    await BillingService.enforceEmployeeLimit(tenantId);
    next();
  } catch (error) {
    next(error);
  }
};

export const enforceStorageLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    // Estimate file size from content-length header
    const estimatedSizeMb = parseInt(req.headers['content-length'] || '0', 10) / (1024 * 1024);
    await BillingService.enforceStorageLimit(tenantId, estimatedSizeMb);
    next();
  } catch (error) {
    next(error);
  }
};
