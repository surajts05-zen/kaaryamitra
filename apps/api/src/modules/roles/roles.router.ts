import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  listRolesHandler,
  getRoleHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
  listEmployeesWithRolesHandler,
  assignRoleHandler,
  revokeRoleHandler,
} from './roles.controller.js';

export const rolesRouter = Router({ mergeParams: true });

// ─── Employee Role Assignment (Must be registered before /:id) ─────────────────
rolesRouter.get('/assignments/employees', asyncHandler(listEmployeesWithRolesHandler));
rolesRouter.post('/assignments/:userId', asyncHandler(assignRoleHandler));
rolesRouter.delete('/assignments/:userId/:roleId', asyncHandler(revokeRoleHandler));

// ─── Roles CRUD ───────────────────────────────────────────────────────────────
rolesRouter.get('/', asyncHandler(listRolesHandler));
rolesRouter.get('/:id', asyncHandler(getRoleHandler));
rolesRouter.post('/', asyncHandler(createRoleHandler));
rolesRouter.put('/:id', asyncHandler(updateRoleHandler));
rolesRouter.delete('/:id', asyncHandler(deleteRoleHandler));
