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
} from './budget-categories.controller.js';

export const budgetCategoriesRouter = Router();

budgetCategoriesRouter.get('/', requirePermission('budget:read'), asyncHandler(listHandler));
budgetCategoriesRouter.post('/', requirePermission('budget:manage'), asyncHandler(createHandler));
budgetCategoriesRouter.post('/bulk', requirePermission('budget:manage'), asyncHandler(bulkCreateHandler));
budgetCategoriesRouter.get('/:id', requirePermission('budget:read'), asyncHandler(getHandler));
budgetCategoriesRouter.put('/:id', requirePermission('budget:manage'), asyncHandler(updateHandler));
budgetCategoriesRouter.delete('/:id', requirePermission('cost-centers:manage'), asyncHandler(deleteHandler));
