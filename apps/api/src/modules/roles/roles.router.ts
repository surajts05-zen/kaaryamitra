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
  listAllPermissionsHandler,
  getRolePermissionsHandler,
  updateRolePermissionsHandler,
} from './roles.controller.js';

export const rolesRouter = Router({ mergeParams: true });

// ─── Permissions List & Assignments ─────────────────────────────────────────
rolesRouter.get('/permissions', asyncHandler(listAllPermissionsHandler));
rolesRouter.get('/assignments/employees', asyncHandler(listEmployeesWithRolesHandler));
rolesRouter.post('/assignments/:userId', asyncHandler(assignRoleHandler));
rolesRouter.delete('/assignments/:userId/:roleId', asyncHandler(revokeRoleHandler));

// ─── Roles CRUD & Permissions ────────────────────────────────────────────────
rolesRouter.get('/', asyncHandler(listRolesHandler));
rolesRouter.get('/:id', asyncHandler(getRoleHandler));
rolesRouter.get('/:id/permissions', asyncHandler(getRolePermissionsHandler));
rolesRouter.put('/:id/permissions', asyncHandler(updateRolePermissionsHandler));
rolesRouter.post('/', asyncHandler(createRoleHandler));
rolesRouter.put('/:id', asyncHandler(updateRoleHandler));
rolesRouter.delete('/:id', asyncHandler(deleteRoleHandler));
