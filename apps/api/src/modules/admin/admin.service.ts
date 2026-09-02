import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { hashPassword } from '../../lib/auth.js';
import type { CreateTenantInput, UpdateTenantInput } from './admin.schema.js';
import crypto from 'node:crypto';

export class AdminService {
  // ── Tenant Management ────────────────────────────────────────────────────────
  
  static async listTenants() {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    return tenants;
  }

  static async getTenantStats() {
    const totalTenants = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
    const totalUsers = await prisma.user.count({ where: { tenantId: { not: null } } });
    
    return {
      totalTenants,
      activeTenants,
      suspendedTenants: totalTenants - activeTenants,
      totalUsers,
    };
  }

  static async createTenant(input: CreateTenantInput) {
    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw AppError.conflict('Tenant slug is already taken');
    }

    // Wrap in transaction to ensure tenant and initial admin user are created together
    return await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          plan: input.plan,
          status: 'ACTIVE',
          documentCategories: {
            create: [
              { name: 'Id Proof', description: 'Government issued ID card', isRequired: true },
              { name: 'Address Proof', description: 'Utility bill, passport, or rent agreement', isRequired: true },
              { name: 'Nationality proof / passport', description: 'Passport or Citizenship document', isRequired: false }
            ]
          },
          helpdeskCategories: {
            create: [
              { name: 'IT Support', description: 'Hardware, software, and network issues' },
              { name: 'HR Inquiry', description: 'Payroll, benefits, and policies' },
              { name: 'Facilities', description: 'Office maintenance and supplies' }
            ]
          }
        },
      });

      // 2. Generate random password for the new tenant admin
      const rawPassword = crypto.randomBytes(8).toString('hex');
      const passwordHash = await hashPassword(rawPassword);

      // 3. Create Tenant Admin User
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.adminEmail.toLowerCase().trim(),
          firstName: input.adminFirstName,
          lastName: input.adminLastName,
          passwordHash,
          authProvider: 'LOCAL',
          status: 'ACTIVE',
          isSuperAdmin: false,
        },
      });

      // (In a real app, we would also assign the 'Company Admin' role to this user here)

      return {
        tenant,
        adminUser: {
          email: adminUser.email,
          generatedPassword: rawPassword, // Return once so Super Admin can share with the new customer
        },
      };
    });
  }

  static async updateTenant(tenantId: string, input: UpdateTenantInput) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw AppError.notFound('Tenant');

    const updateData: any = { ...input };
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return updated;
  }

  static async resetTenantAdminPassword(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw AppError.notFound('Tenant');

    // Find the primary admin user for this workspace
    const adminUser = await prisma.user.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
      throw AppError.notFound('Admin user for this workspace');
    }

    const rawPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(rawPassword);

    await prisma.user.update({
      where: { id: adminUser.id },
      data: { passwordHash },
    });

    return {
      email: adminUser.email,
      generatedPassword: rawPassword,
    };
  }
}
