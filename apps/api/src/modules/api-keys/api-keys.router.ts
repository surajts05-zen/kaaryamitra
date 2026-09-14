import { Router } from 'express';
import { ApiKeysController } from './api-keys.controller.js';
import { requirePermission } from '../../middleware/auth.js';
import { createApiKeySchema, updateApiKeySchema } from './api-keys.schema.js';

export const apiKeysRouter = Router({ mergeParams: true });
const controller = new ApiKeysController();

// All API key operations require admin access to tenant settings
apiKeysRouter.use(requirePermission('settings:manage'));

apiKeysRouter.get('/', controller.listApiKeys);
apiKeysRouter.post('/', controller.createApiKey);
apiKeysRouter.patch('/:id', controller.updateApiKey);
apiKeysRouter.delete('/:id', controller.revokeApiKey);
apiKeysRouter.get('/:id/audit', controller.getAuditLogs);
