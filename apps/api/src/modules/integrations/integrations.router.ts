import { Router } from 'express';
import { IntegrationsController } from './integrations.controller.js';
import { requirePermission } from '../../middleware/auth.js';

export const integrationsRouter = Router({ mergeParams: true });
const controller = new IntegrationsController();

// All integration operations require admin access to tenant settings
integrationsRouter.use(requirePermission('settings:manage'));

integrationsRouter.get('/', controller.listIntegrations);
integrationsRouter.post('/', controller.configureIntegration);
integrationsRouter.patch('/:id/status', controller.updateIntegrationStatus);
integrationsRouter.delete('/:id', controller.deleteIntegration);
