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
  const { id } = req.params;
  const role = await getRole(tenantId, id!);
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
  const { id } = req.params;
  const data = z
    .object({ name: z.string().min(1).optional(), description: z.string().optional() })
    .parse(req.body);
  const role = await updateRole(tenantId, id!, data);
  res.json({ data: role, message: 'Role updated' });
}

export async function deleteRoleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { id } = req.params;
  await deleteRole(tenantId, id!);
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
  const { userId } = req.params;
  const { roleId } = z.object({ roleId: z.string() }).parse(req.body);
  if (!userId) throw new AppError(400, 'VALIDATION_ERROR', 'userId is required');
  await assignRole(tenantId, userId, roleId);
  res.json({ message: 'Role assigned successfully' });
}

export async function revokeRoleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { userId, roleId } = req.params;
  if (!userId || !roleId) throw new AppError(400, 'VALIDATION_ERROR', 'userId and roleId are required');
  await revokeRole(tenantId, userId, roleId);
  res.json({ message: 'Role revoked' });
}
