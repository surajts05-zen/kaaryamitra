import { Router } from 'express';
import { WebhooksController } from './webhooks.controller.js';
import { requirePermission } from '../../middleware/auth.js';
import { createWebhookSchema, updateWebhookSchema } from './webhooks.schema.js';

export const webhooksRouter = Router({ mergeParams: true });
const controller = new WebhooksController();

// All webhook operations require admin access to tenant settings
webhooksRouter.use(requirePermission('settings:manage'));

webhooksRouter.get('/', controller.listWebhooks);
webhooksRouter.post('/', controller.createWebhook);
webhooksRouter.put('/:id', controller.updateWebhook);
webhooksRouter.patch('/:id', controller.updateWebhook);
webhooksRouter.delete('/:id', controller.deleteWebhook);
webhooksRouter.get('/:id/deliveries', controller.getDeliveries);
webhooksRouter.post('/:id/test', controller.testWebhook);
webhooksRouter.get('/:id/secret', controller.revealSecret);
