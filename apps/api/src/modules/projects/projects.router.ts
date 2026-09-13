import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requirePermission } from '../../middleware/auth.js';
import { 
  listHandler, 
  getHandler, 
  createHandler, 
  bulkCreateHandler,
  updateHandler, 
  addMemberHandler,
  removeMemberHandler
} from './projects.controller.js';

export const projectsRouter = Router();

projectsRouter.get('/', requirePermission('projects:read'), asyncHandler(listHandler));
projectsRouter.post('/', requirePermission('projects:manage'), asyncHandler(createHandler));
projectsRouter.post('/bulk', requirePermission('projects:manage'), asyncHandler(bulkCreateHandler));
projectsRouter.get('/:id', requirePermission('projects:read'), asyncHandler(getHandler));
projectsRouter.put('/:id', requirePermission('projects:manage'), asyncHandler(updateHandler));

projectsRouter.post('/:id/members', requirePermission('projects:manage'), asyncHandler(addMemberHandler));
projectsRouter.delete('/:id/members/:memberId', requirePermission('projects:manage'), asyncHandler(removeMemberHandler));
