import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
  revokeRole,
  listEmployeesWithRoles,
  seedSystemRoles,
  listAllPermissions,
  getRolePermissions,
  updateRolePermissions,
} from './roles.service.js';

// ─── Roles CRUD ────────────────────────────────────────────────────────────────

export async function listRolesHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  // Auto-seed system roles on first access
  await seedSystemRoles(tenantId);
  const roles = await listRoles(tenantId);
  res.json({ data: roles });
}

export async function getRoleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  const role = await getRole(tenantId, id);
  res.json({ data: role });
}

export async function createRoleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { name, description } = z
    .object({ name: z.string().min(1), description: z.string().optional() })
    .parse(req.body);
  const role = await createRole(tenantId, name, description);
  res.status(201).json({ data: role, message: 'Role created successfully' });
}

export async function updateRoleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  const data = z
    .object({ name: z.string().min(1).optional(), description: z.string().optional() })
    .parse(req.body);
  const role = await updateRole(tenantId, id, data);
  res.json({ data: role, message: 'Role updated' });
}

export async function deleteRoleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  await deleteRole(tenantId, id);
  res.json({ message: 'Role deleted' });
}

// ─── User Role Assignment ──────────────────────────────────────────────────────

export async function listEmployeesWithRolesHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const employees = await listEmployeesWithRoles(tenantId);
  res.json({ data: employees });
}

export async function assignRoleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.params['userId'] as string;
  const { roleId } = z.object({ roleId: z.string() }).parse(req.body);
  if (!userId) throw new AppError(400, 'VALIDATION_ERROR', 'userId is required');
  await assignRole(tenantId, userId, roleId);
  res.json({ message: 'Role assigned successfully' });
}

export async function revokeRoleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.params['userId'] as string;
  const roleId = req.params['roleId'] as string;
  if (!userId || !roleId) throw new AppError(400, 'VALIDATION_ERROR', 'userId and roleId are required');
  await revokeRole(tenantId, userId, roleId);
  res.json({ message: 'Role revoked' });
}

// ─── Permission Management ────────────────────────────────────────────────────

export async function listAllPermissionsHandler(_req: Request, res: Response) {
  const permissions = await listAllPermissions();
  res.json({ data: permissions });
}

export async function getRolePermissionsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  const permissions = await getRolePermissions(tenantId, id);
  res.json({ data: permissions });
}

export async function updateRolePermissionsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  const { permissionIds } = z
    .object({ permissionIds: z.array(z.string()) })
    .parse(req.body);
  const updated = await updateRolePermissions(tenantId, id, permissionIds);
  res.json({ data: updated, message: 'Permissions updated successfully' });
}
