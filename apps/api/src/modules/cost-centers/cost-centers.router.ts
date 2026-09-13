import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { 
  listHandler, 
  getHandler, 
  createHandler, 
  bulkCreateHandler,
  updateHandler, 
  deleteHandler 
} from './cost-centers.controller.js';

export const costCentersRouter = Router();

costCentersRouter.get('/', requirePermission('budget:read'), asyncHandler(listHandler));
costCentersRouter.post('/', requirePermission('cost-centers:manage'), asyncHandler(createHandler));
costCentersRouter.post('/bulk', requirePermission('cost-centers:manage'), asyncHandler(bulkCreateHandler));
costCentersRouter.get('/:id', requirePermission('budget:read'), asyncHandler(getHandler));
costCentersRouter.put('/:id', requirePermission('budget:manage'), asyncHandler(updateHandler));
costCentersRouter.delete('/:id', requirePermission('cost-centers:manage'), asyncHandler(deleteHandler));
