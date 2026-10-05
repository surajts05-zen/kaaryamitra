import { prisma } from '../../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateSessionId,
} from '../../lib/auth.js';
import { AppError } from '../../lib/errors.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import crypto from 'node:crypto';

import { AdminService } from '../admin/admin.service.js';

export class AuthService {
  // ── Register ────────────────────────────────────────────────────────────────

  static async register(input: RegisterInput) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({ 
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } } 
    });
    if (existing) throw AppError.conflict('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);

    // Generate slug from company name
    const baseSlug = input.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { user, tenant } = await prisma.$transaction(async (tx) => {
      // Create a 14-day trial on the ENTERPRISE plan
      const tenant = await AdminService.createTenantWithDefaults(tx, input.companyName, slug, 'ENTERPRISE', 'TRIAL');

      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const enterprisePlan = await (tx as any).planDefinition.findUnique({
        where: { slug: 'ENTERPRISE' }
      });
      const planId = enterprisePlan ? enterprisePlan.id : 'enterprise-monthly';

      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: planId,
          billingCycle: 'MONTHLY',
          status: 'TRIALING',
          currency: 'INR',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd: trialEnd,
        },
      });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: normalizedEmail,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash,
          authProvider: 'LOCAL',
          status: 'ACTIVE',
        },
      });

      const companyAdminRole = tenant.roles.find((r: any) => r.name === 'Company Admin');
      if (companyAdminRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: companyAdminRole.id },
        });
      }

      return { user, tenant };
    });

    const sessionId = generateSessionId();
    const { accessToken, refreshToken } = await AuthService.createSession(user.id, sessionId);

    return { user: AuthService.sanitizeUser(user), accessToken, refreshToken };
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  static async login(
    input: LoginInput,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      include: {
        tenant: { 
          select: { 
            slug: true,
            plan: true,
            subscription: { select: { trialEnd: true } }
          } 
        },
        userRoles: { include: { role: true } },
      },
    });
    if (!user || !user.passwordHash) throw AppError.invalidCredentials();
    if (user.status === 'INACTIVE') throw AppError.forbidden('Account is deactivated');

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) throw AppError.invalidCredentials();

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const sessionId = generateSessionId();
    const { accessToken, refreshToken } = await AuthService.createSession(
      user.id,
      sessionId,
      meta,
    );

    return { user: AuthService.sanitizeUser(user), accessToken, refreshToken };
  }

  // ── Refresh Tokens ──────────────────────────────────────────────────────────

  static async refreshTokens(incomingRefreshToken: string) {
    const payload = verifyRefreshToken(incomingRefreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshToken: incomingRefreshToken },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw AppError.tokenExpired();
    }

    if (session.userId !== payload.userId) {
      throw AppError.unauthorized('Token mismatch');
    }

    // Extend existing session instead of rotating to prevent race conditions with concurrent requests
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt },
    });

    const accessToken = signAccessToken({
      userId: session.user.id,
      tenantId: session.user.tenantId,
      email: session.user.email,
      isSuperAdmin: session.user.isSuperAdmin,
      sessionId: session.id,
    });

    return { accessToken, refreshToken: incomingRefreshToken };
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  static async logout(refreshToken: string): Promise<void> {
    await prisma.session
      .update({
        where: { refreshToken },
        data: { revokedAt: new Date() },
      })
      .catch(() => {
        // Silently ignore if session not found
      });
  }

  // ── Public Options ────────────────────────────────────────────────────────
  static async getSsoOptions() {
    let settings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
      select: { enableGoogleSso: true, enableZohoSso: true },
    });
    if (!settings) {
      settings = { enableGoogleSso: true, enableZohoSso: false };
    }
    return settings;
  }

  // ── Google SSO ─────────────────────────────────────────────────────────────

  static async googleLoginOrRegister(
    email: string,
    firstName: string,
    lastName: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      include: {
        tenant: { 
          select: { 
            slug: true,
            plan: true,
            subscription: { select: { trialEnd: true } }
          } 
        },
        userRoles: { include: { role: true } },
      },
    });

    if (user) {
      if (user.status === 'INACTIVE') throw AppError.forbidden('Account is deactivated');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } else {
      // User doesn't exist, create an orphan user for "Complete Setup" flow
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          firstName,
          lastName,
          authProvider: 'GOOGLE',
          status: 'ACTIVE',
        },
        include: {
          tenant: { 
            select: { 
              slug: true,
              plan: true,
              subscription: { select: { trialEnd: true } }
            } 
          },
          userRoles: { include: { role: true } },
        },
      });
    }

    const sessionId = generateSessionId();
    const { accessToken, refreshToken } = await AuthService.createSession(
      user.id,
      sessionId,
      meta,
    );

    return { user: AuthService.sanitizeUser(user), accessToken, refreshToken, requiresSetup: !user.tenantId && !user.isSuperAdmin };
  }

  // ── Zoho SSO ───────────────────────────────────────────────────────────────

  static async zohoLoginOrRegister(
    email: string,
    firstName: string,
    lastName: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      include: {
        tenant: { 
          select: { 
            slug: true,
            plan: true,
            subscription: { select: { trialEnd: true } }
          } 
        },
        userRoles: { include: { role: true } },
      },
    });

    if (user) {
      if (user.status === 'INACTIVE') throw AppError.forbidden('Account is deactivated');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } else {
      // User doesn't exist, create an orphan user for "Complete Setup" flow
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          firstName,
          lastName,
          authProvider: 'ZOHO',
          status: 'ACTIVE',
        },
        include: {
          tenant: { 
            select: { 
              slug: true,
              plan: true,
              subscription: { select: { trialEnd: true } }
            } 
          },
          userRoles: { include: { role: true } },
        },
      });
    }

    const sessionId = generateSessionId();
    const { accessToken, refreshToken } = await AuthService.createSession(
      user.id,
      sessionId,
      meta,
    );

    return { user: AuthService.sanitizeUser(user), accessToken, refreshToken, requiresSetup: !user.tenantId && !user.isSuperAdmin };
  }


  static async completeSetup(userId: string, companyName: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    if (user.tenantId) throw AppError.badRequest('Setup already completed');

    const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await AdminService.createTenantWithDefaults(tx, companyName, slug, 'ENTERPRISE', 'TRIAL');
      
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const enterprisePlan = await (tx as any).planDefinition.findUnique({
        where: { slug: 'ENTERPRISE' }
      });
      const planId = enterprisePlan ? enterprisePlan.id : 'enterprise-monthly';

      await tx.tenantSubscription.create({
        data: {
          tenantId: newTenant.id,
          planId: planId,
          billingCycle: 'MONTHLY',
          status: 'TRIALING',
          currency: 'INR',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd: trialEnd,
        },
      });
      
      await tx.user.update({
        where: { id: user.id },
        data: { tenantId: newTenant.id },
      });

      const companyAdminRole = newTenant.roles.find((r: any) => r.name === 'Company Admin');
      if (companyAdminRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: companyAdminRole.id },
        });
      }

      return newTenant;
    });

    return tenant;
  }

  // ── Get Me ──────────────────────────────────────────────────────────────────

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: { 
          select: { 
            slug: true, 
            plan: true,
            subscription: { select: { trialEnd: true } }
          } 
        },
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    if (!user) throw AppError.notFound('User');
    return AuthService.sanitizeUser(user);
  }

  // ── Presence & Pinned Colleagues ────────────────────────────────────────────

  static async updatePresence(userId: string, presenceStatus: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { presenceStatus },
      include: { tenant: { select: { slug: true } }, userRoles: { include: { role: true } } },
    });
    return AuthService.sanitizeUser(user);
  }

  static async updatePinnedColleagues(userId: string, pinnedEmployeeIds: string[]) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { pinnedEmployeeIds },
      include: { tenant: { select: { slug: true } }, userRoles: { include: { role: true } } },
    });
    return AuthService.sanitizeUser(user);
  }

  static async getBulkPresence(userIds: string[]) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, presenceStatus: true },
    });
    const result: Record<string, string> = {};
    for (const u of users) {
      if (u.presenceStatus) result[u.id] = u.presenceStatus;
    }
    return result;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private static async createSession(
    userId: string,
    sessionId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      sessionId,
    });

    const refreshToken = signRefreshToken({ userId: user.id, sessionId });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken,
        expiresAt,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    });

    return { accessToken, refreshToken };
  }

  private static sanitizeUser(user: any) {
    const roles: string[] = (user.userRoles ?? []).map((ur: any) => ur.role?.name).filter(Boolean);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug ?? null,
      tenantPlan: user.tenant?.plan ?? null,
      tenantTrialEndsAt: user.tenant?.subscription?.trialEnd ?? null,
      roles,
      presenceStatus: user.presenceStatus,
      pinnedEmployeeIds: user.pinnedEmployeeIds,
    };
  }
}
