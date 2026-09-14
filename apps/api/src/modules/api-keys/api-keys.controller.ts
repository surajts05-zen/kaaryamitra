import { Request, Response, NextFunction } from 'express';
import { ApiKeysService } from './api-keys.service.js';
import { AppError } from '../../lib/errors.js';

export class ApiKeysController {
  private service = new ApiKeysService();

  listApiKeys = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const keys = await this.service.listKeys(tenantId);
      res.json({ success: true, data: keys });
    } catch (error) {
      next(error);
    }
  };

  createApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.auth!.userId;
      
      const { name, scopes, expiresAt } = req.body;
      
      const result = await this.service.createKey(tenantId, userId, {
        name,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      const { name, scopes, expiresAt, status } = req.body;
      
      const updated = await this.service.updateKey(tenantId, id, {
        ...(name !== undefined && { name }),
        ...(scopes !== undefined && { scopes }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(status !== undefined && { status }),
      });
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  revokeApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      
      await this.service.deleteKey(tenantId, id);
      
      res.json({ success: true, message: 'API key deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      
      const logs = await this.service.getAuditLogs(tenantId, id);
      
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  };
}
