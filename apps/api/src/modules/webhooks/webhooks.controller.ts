import { Request, Response, NextFunction } from 'express';
import { WebhooksService } from './webhooks.service.js';
import { createWebhookSchema, updateWebhookSchema } from './webhooks.schema.js';

export class WebhooksController {
  private service = new WebhooksService();

  listWebhooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const webhooks = await this.service.listWebhooks(tenantId);
      res.json({ success: true, data: webhooks });
    } catch (error) {
      next(error);
    }
  };

  createWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const parsed = createWebhookSchema.shape.body.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
        return;
      }
      const result = await this.service.createWebhook(tenantId, parsed.data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      const parsed = updateWebhookSchema.shape.body.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message } });
        return;
      }
      const updated = await this.service.updateWebhook(tenantId, id, parsed.data);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  deleteWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      await this.service.deleteWebhook(tenantId, id);
      res.json({ success: true, message: 'Webhook endpoint deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  getDeliveries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      const deliveries = await this.service.getDeliveries(tenantId, id);
      res.json({ success: true, data: deliveries });
    } catch (error) {
      next(error);
    }
  };

  revealSecret = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      const result = await this.service.revealSecret(tenantId, id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  testWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id as string;
      const result = await this.service.testWebhook(tenantId, id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
