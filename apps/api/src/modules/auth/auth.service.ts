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

export class AuthService {
  // ── Register ────────────────────────────────────────────────────────────────

  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw AppError.conflict('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        authProvider: 'LOCAL',
        status: 'ACTIVE',
      },
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
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { tenant: { select: { slug: true } } },
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

    // Rotate: revoke old session, create new one
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const newSessionId = generateSessionId();
    const { accessToken, refreshToken } = await AuthService.createSession(
      session.userId,
      newSessionId,
    );

    return { accessToken, refreshToken };
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

  // ── Get Me ──────────────────────────────────────────────────────────────────

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: { select: { slug: true } },
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
    };
  }
}
