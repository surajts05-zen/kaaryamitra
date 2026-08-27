import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import type { AuthTokenPayload } from '@kaaryamitra/shared-types';

// ── Password ──────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number, // or cast to string
    issuer: 'kaaryamitra',
    audience: 'kaaryamitra-app',
  });
}

export function signRefreshToken(payload: Pick<AuthTokenPayload, 'userId' | 'sessionId'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number,
    issuer: 'kaaryamitra',
    audience: 'kaaryamitra-refresh',
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'kaaryamitra',
      audience: 'kaaryamitra-app',
    }) as AuthTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.tokenExpired();
    }
    throw AppError.unauthorized('Invalid access token');
  }
}

export function verifyRefreshToken(
  token: string,
): Pick<AuthTokenPayload, 'userId' | 'sessionId'> {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'kaaryamitra',
      audience: 'kaaryamitra-refresh',
    }) as Pick<AuthTokenPayload, 'userId' | 'sessionId'>;
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
}

// ── Session ID Generator ──────────────────────────────────────────────────────

export function generateSessionId(): string {
  return crypto.randomUUID();
}
