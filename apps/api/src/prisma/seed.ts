import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KaaryaMitra database...\n');

  // ── Permissions ──────────────────────────────────────────────────────────────
  const permissions = [
    { action: 'employee:read', description: 'View employee records' },
    { action: 'employee:create', description: 'Create new employees' },
    { action: 'employee:update', description: 'Update employee records' },
    { action: 'employee:delete', description: 'Delete/offboard employees' },
    { action: 'employee:import', description: 'Bulk import employees' },
    { action: 'employee:export', description: 'Export employee data' },
    { action: 'org:read', description: 'View organization structure' },
    { action: 'org:manage', description: 'Manage departments, teams, locations' },
    { action: 'leave:read', description: 'View leave records' },
    { action: 'leave:apply', description: 'Apply for leave' },
    { action: 'leave:approve', description: 'Approve/reject leave applications' },
    { action: 'leave:manage_types', description: 'Manage leave types' },
    { action: 'leave:manage_policies', description: 'Manage leave policies' },
    { action: 'attendance:read', description: 'View attendance records' },
    { action: 'attendance:checkin', description: 'Check in/out attendance' },
    { action: 'attendance:manage', description: 'Manage attendance records' },
    { action: 'attendance:manage_locations', description: 'Manage attendance locations' },
    { action: 'document:read', description: 'View documents' },
    { action: 'document:upload', description: 'Upload documents' },
    { action: 'document:delete', description: 'Delete documents' },
    { action: 'document:manage', description: 'Manage all documents' },
    { action: 'report:read', description: 'View reports' },
    { action: 'report:create', description: 'Create custom reports' },
    { action: 'report:export', description: 'Export reports' },
    { action: 'settings:read', description: 'View tenant settings' },
    { action: 'settings:manage', description: 'Manage tenant settings' },
    { action: 'tenant:manage', description: 'Manage tenants (Super Admin)' },
    { action: 'platform:manage', description: 'Platform-level management (Super Admin)' },
  ];

  console.log('📋 Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`   ✓ ${permissions.length} permissions seeded`);

  // ── Platform Roles ────────────────────────────────────────────────────────────
  // Super Admin role
  let superAdminRole = await prisma.role.findFirst({
    where: { tenantId: null, name: 'Super Admin' },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        tenantId: null,
        name: 'Super Admin',
        description: 'Platform-level administrator',
        isSystem: true,
      },
    });
  }

  // Link all permissions to Super Admin role
  const allPerms = await prisma.permission.findMany({ select: { id: true } });
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }
  console.log(`   ✓ Super Admin role created`);

  // ── Super Admin User ──────────────────────────────────────────────────────────
  const adminEmail = process.env['SUPER_ADMIN_EMAIL'] ?? 'admin@kaaryamitra.com';
  const adminPassword = process.env['SUPER_ADMIN_PASSWORD'] ?? 'Admin@123456';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: adminPasswordHash,
      authProvider: 'LOCAL',
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });

  // Assign super admin role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id },
  });

  console.log(`\n✅ Seed complete!`);
  console.log(`\n🔑 Super Admin credentials:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n⚠️  Change the Super Admin password immediately after first login!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
