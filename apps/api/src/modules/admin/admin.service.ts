import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { hashPassword } from '../../lib/auth.js';
import type { CreateTenantInput, UpdateTenantInput, UpdatePlatformSettingsInput } from './admin.schema.js';
import crypto from 'node:crypto';
import { SYSTEM_ROLES } from '../roles/roles.service.js';
import { sendEmail, buildEmailHtml } from '../notifications/notification.service.js';
import { PoliciesService } from '../policies/policies.service.js';

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
    const { tenant, adminUser, generatedUsers } = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant and default roles
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
          },
          checklistTemplates: {
            create: [
              {
                name: 'Standard Onboarding',
                type: 'ONBOARDING',
                description: 'Default onboarding checklist for new hires',
                tasks: {
                  create: [
                    { title: 'Setup Workstation & Hardware', assigneeRole: 'IT', description: 'Provide laptop and required accessories' },
                    { title: 'Create Email & Software Accounts', assigneeRole: 'IT', description: 'Create work accounts' },
                    { title: 'Collect Legal Documents', assigneeRole: 'HR', description: 'Collect signed documents and ID' },
                    { title: 'Welcome Orientation', assigneeRole: 'MANAGER', description: 'Introduce to the team' }
                  ]
                }
              },
              {
                name: 'Standard Offboarding',
                type: 'OFFBOARDING',
                description: 'Default offboarding checklist',
                tasks: {
                  create: [
                    { title: 'Revoke System Access', assigneeRole: 'IT', description: 'Disable email and software access' },
                    { title: 'Return of Assets', assigneeRole: 'IT', description: 'Ensure all assigned laptops, hardware, and access cards are returned' },
                    { title: 'Conduct Exit Interview', assigneeRole: 'HR', description: 'Gather feedback before departure' },
                    { title: 'Process Final Settlement', assigneeRole: 'HR', description: 'Clear dues and process F&F' }
                  ]
                }
              }
            ]
          },
          roles: {
            create: SYSTEM_ROLES.map(r => ({
              name: r.name,
              description: r.description,
              isSystem: r.isSystem,
            }))
          }
        },
        include: { roles: true }
      });

      // 2. Generate random password for the new tenant admin
      const adminPassword = crypto.randomBytes(8).toString('hex');
      const adminPasswordHash = await hashPassword(adminPassword);


      // 3. Create Tenant Admin User
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.adminEmail.toLowerCase().trim(),
          firstName: input.adminFirstName,
          lastName: input.adminLastName,
          passwordHash: adminPasswordHash,
          authProvider: 'LOCAL',
          status: 'ACTIVE',
          isSuperAdmin: false,
        },
      });

      // Assign Company Admin role to the Tenant Admin
      const companyAdminRole = tenant.roles.find(r => r.name === 'Company Admin');
      if (companyAdminRole) {
        await tx.userRole.create({
          data: { userId: adminUser.id, roleId: companyAdminRole.id },
        });
      }

      // 4. Generate Example Users for the other roles
      const generatedUsers: { email: string; password: string; role: string }[] = [];
      
      const rolesToSeed = tenant.roles.filter(r => r.name !== 'Company Admin');
      for (const role of rolesToSeed) {
        const rawPassword = crypto.randomBytes(8).toString('hex');
        const passwordHash = await hashPassword(rawPassword);
        
        const slugRoleName = role.name.toLowerCase().replace(/\s+/g, '.');
        const email = `${slugRoleName}@${input.slug}.example.com`;
        const firstName = 'Example';
        const lastName = role.name;

        await tx.user.create({
          data: {
            tenantId: tenant.id,
            email,
            firstName,
            lastName,
            passwordHash,
            authProvider: 'LOCAL',
            status: 'ACTIVE',
            isSuperAdmin: false,
            employee: {
              create: {
                tenantId: tenant.id,
                firstName,
                lastName,
                workEmail: email,
                employeeCode: `EMP-${slugRoleName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}`,
                joiningDate: new Date(),
              }
            },
            userRoles: {
              create: [{ roleId: role.id }]
            }
          }
        });

        generatedUsers.push({ email, password: rawPassword, role: role.name });
      }

      return {
        tenant,
        adminUser: {
          email: adminUser.email,
          generatedPassword: adminPassword,
        },
        generatedUsers,
      };
    });

    // Seed standard policies and handbook for the new tenant
    await PoliciesService.seedStandardPoliciesForTenant(tenant.id);

    // 5. Send Welcome Email with all credentials to the Tenant Admin

    try {
      const title = `Welcome to KaaryaMitra - ${input.name}`;
      const htmlBody = `
        <p>Your workspace <strong>${input.name}</strong> has been successfully created.</p>
        <p>You can log in to your tenant dashboard using your primary admin credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${adminUser.email}</li>
          <li><strong>Password:</strong> ${adminUser.generatedPassword}</li>
        </ul>
        <br/>
        <h3>Example Users</h3>
        <p>To help you explore the platform's role-based access control, we've automatically generated example users for each system role. You can log in with these credentials to see what each role can access:</p>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; border: 1px solid #e5e7eb;">
          <tr style="background-color: #f9fafb;">
            <th align="left">Role</th>
            <th align="left">Email</th>
            <th align="left">Password</th>
          </tr>
          ${generatedUsers.map(u => `
            <tr>
              <td>${u.role}</td>
              <td>${u.email}</td>
              <td><code>${u.password}</code></td>
            </tr>
          `).join('')}
        </table>
        <br/>
        <p>You can change these passwords or delete these example users at any time from the Employee Directory.</p>
      `;

      await sendEmail({
        to: input.adminEmail,
        subject: title,
        html: buildEmailHtml(title, htmlBody),
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return { tenant, adminUser, generatedUsers };
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

  // ── Platform Settings ───────────────────────────────────────────────────────

  static async getPlatformSettings() {
    const settings = await (prisma as any).platformSettings.findUnique({
      where: { id: 'global' },
    });
    return settings ?? {
      id: 'global',
      smtpHost: null,
      smtpPort: 587,
      smtpUser: null,
      smtpPass: null,
      smtpFrom: null,
      geminiApiKey: null,
    };
  }

  static async updatePlatformSettings(input: UpdatePlatformSettingsInput) {
    const updated = await (prisma as any).platformSettings.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        ...input,
      },
      update: input,
    });
    return updated;
  }
}
