import { Request, Response, NextFunction } from 'express';
import { IntegrationsService } from './integrations.service.js';
import { configureIntegrationSchema } from './integrations.schema.js';

export class IntegrationsController {
  private service = new IntegrationsService();

  listIntegrations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const integrations = await this.service.listIntegrations(tenantId);
      res.json({ success: true, data: integrations });
    } catch (error) {
      next(error);
    }
  };

  configureIntegration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const parsed = configureIntegrationSchema.shape.body.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
        return;
      }
      const result = await this.service.configureIntegration(tenantId, parsed.data);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateIntegrationStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      const { status } = req.body;
      const updated = await this.service.updateIntegrationStatus(tenantId, id, status);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  deleteIntegration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      await this.service.deleteIntegration(tenantId, id);
      res.json({ success: true, message: 'Integration deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
