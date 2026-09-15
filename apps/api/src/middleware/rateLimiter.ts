/**
 * Centralized rate limiter factory.
 *
 * Uses Redis-backed store (rate-limit-redis + ioredis) in production
 * for distributed rate limiting across multiple API instances.
 * Falls back to in-memory for development.
 */

import rateLimit, { type Store, type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';
import { env, isDev } from '../config/env.js';
import { logger } from '../lib/logger.js';

// ─── Shared Redis client for rate limiting ────────────────────────────────────

let redisRateLimitClient: ReturnType<typeof createClient> | null = null;

function getRedisClient() {
  if (isDev) return null; // Use in-memory store in development
  if (redisRateLimitClient) return redisRateLimitClient;

  try {
    redisRateLimitClient = createClient({ url: env.REDIS_URL });
    redisRateLimitClient.on('error', (err: Error) => {
      logger.warn({ err: err.message }, '[RateLimit] Redis client error — will retry');
    });
    redisRateLimitClient.connect().catch((err: Error) => {
      logger.warn({ err: err.message }, '[RateLimit] Failed to connect Redis for rate limiting');
      redisRateLimitClient = null;
    });
    return redisRateLimitClient;
  } catch (err) {
    logger.warn({ err }, '[RateLimit] Failed to create Redis client for rate limiting');
    return null;
  }
}

// ─── Store factory ────────────────────────────────────────────────────────────

function makeStore(prefix: string): Store | undefined {
  const redis = getRedisClient();
  if (!redis) return undefined; // express-rate-limit uses MemoryStore by default

  return new RedisStore({
    sendCommand: (...args: string[]) => (redis as any).sendCommand(args),
    prefix: `rl:${prefix}:`,
  });
}

// ─── Limiter factory helper ───────────────────────────────────────────────────

function makeLimiter(prefix: string, opts: Omit<Partial<Options>, 'store'>): ReturnType<typeof rateLimit> {
  const store = makeStore(prefix);
  const config: Partial<Options> = { ...opts, validate: { xForwardedForHeader: false, default: false } };
  if (store) config.store = store;
  return rateLimit(config as Partial<Options>);
}

// ─── Error response helper ────────────────────────────────────────────────────

function rateLimitResponse(code: string, message: string) {
  return { success: false, error: { code, message } };
}

// ─── Rate limiters ────────────────────────────────────────────────────────────

/**
 * Global fallback — 500 requests per 15 minutes per IP.
 */
export const globalRateLimiter = makeLimiter('global', {
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitResponse('RATE_LIMITED', 'Too many requests, please try again later.'),
});

/**
 * Auth endpoints — 10 requests per 15 minutes per IP.
 * Protects login, register, forgot-password from brute force.
 */
export const authRateLimiter = makeLimiter('auth', {
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitResponse(
    'AUTH_RATE_LIMITED',
    'Too many authentication attempts. Please try again in 15 minutes.',
  ),
  skipSuccessfulRequests: false,
});

/**
 * AI endpoints — 20 requests per minute per IP.
 * Expensive Gemini API calls; prevents runaway usage.
 */
export const aiRateLimiter = makeLimiter('ai', {
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitResponse(
    'AI_RATE_LIMITED',
    'AI request limit reached. Please wait a moment before making more AI requests.',
  ),
});

/**
 * Per-tenant rate limiter — 200 requests per 15 minutes keyed on tenantId.
 */
export const tenantRateLimiter = makeLimiter('tenant', {
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).tenantId || req.ip || 'unknown',
  message: rateLimitResponse(
    'TENANT_RATE_LIMITED',
    'Your workspace has exceeded its API rate limit. Please slow down your requests.',
  ),
});

/**
 * Password reset endpoint — 3 requests per hour per IP.
 */
export const passwordResetRateLimiter = makeLimiter('pwd-reset', {
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitResponse(
    'PASSWORD_RESET_RATE_LIMITED',
    'Too many password reset requests. Please try again in an hour.',
  ),
});
