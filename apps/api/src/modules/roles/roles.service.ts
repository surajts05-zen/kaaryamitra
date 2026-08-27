import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

// ─── System roles seeded per tenant ───────────────────────────────────────────

export const SYSTEM_ROLES = [
  {
    name: 'Company Admin',
    description: 'Full access to manage the company, employees, settings, and workflows.',
    isSystem: true,
  },
  {
    name: 'HR Manager',
    description: 'Manage employees, leave types, and view reports.',
    isSystem: true,
  },
  {
    name: 'Manager',
    description: 'View and approve leave for direct reportees.',
    isSystem: true,
  },
  {
    name: 'Employee',
    description: 'Access to personal ESS features only.',
    isSystem: true,
  },
];

// ─── Seed system roles for a tenant if not already present ────────────────────

export async function seedSystemRoles(tenantId: string) {
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: role.name } },
      create: { tenantId, ...role },
      update: {},
    });
  }
}

// ─── List roles ───────────────────────────────────────────────────────────────

export async function listRoles(tenantId: string) {
  return prisma.role.findMany({
    where: { tenantId },
    include: {
      _count: { select: { userRoles: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getRole(tenantId: string, roleId: string) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, tenantId },
    include: {
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  department: { select: { name: true } },
                  designation: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!role) throw AppError.notFound('Role');
  return role;
}

export async function createRole(tenantId: string, name: string, description?: string) {
  const existing = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId, name } },
  });
  if (existing) throw AppError.conflict('A role with this name already exists');

  return prisma.role.create({
    data: { tenantId, name, description: description ?? null },
  });
}

export async function updateRole(
  tenantId: string,
  roleId: string,
  data: { name?: string; description?: string },
) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (!role) throw AppError.notFound('Role');
  if (role.isSystem && data.name) throw AppError.badRequest('System role names cannot be changed');

  return prisma.role.update({
    where: { id: roleId },
    data: { name: data.name, description: data.description },
  });
}

export async function deleteRole(tenantId: string, roleId: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (!role) throw AppError.notFound('Role');
  if (role.isSystem) throw AppError.badRequest('System roles cannot be deleted');

  return prisma.role.delete({ where: { id: roleId } });
}

// ─── User role assignment ─────────────────────────────────────────────────────

export async function assignRole(tenantId: string, userId: string, roleId: string) {
  // Verify role belongs to this tenant
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (!role) throw AppError.notFound('Role');

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User');

  if (!user.tenantId) {
    await prisma.user.update({
      where: { id: userId },
      data: { tenantId },
    });
  }

  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    create: { userId, roleId },
    update: {},
  });
}

export async function revokeRole(tenantId: string, userId: string, roleId: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (!role) throw AppError.notFound('Role');

  return prisma.userRole.delete({
    where: { userId_roleId: { userId, roleId } },
  });
}

export async function getUserRoles(tenantId: string, userId: string) {
  return prisma.userRole.findMany({
    where: {
      userId,
      role: { tenantId },
    },
    include: { role: true },
  });
}

// ─── List all employees with their roles ──────────────────────────────────────

export async function listEmployeesWithRoles(tenantId: string) {
  const users = await prisma.user.findMany({
    where: { tenantId },
    include: {
      employee: {
        include: {
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
      userRoles: {
        include: { role: { select: { id: true, name: true, isSystem: true } } },
        where: { role: { tenantId } },
      },
    },
    orderBy: { firstName: 'asc' },
  });

  return users.map((u) => ({
    id: u.employee?.id ?? u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    employeeCode: u.employee?.employeeCode ?? 'ADMIN',
    department: u.employee?.department ?? null,
    designation: u.employee?.designation ?? { name: 'Tenant Admin' },
    user: {
      id: u.id,
      email: u.email,
      status: u.status,
      userRoles: u.userRoles,
    },
  }));
}
