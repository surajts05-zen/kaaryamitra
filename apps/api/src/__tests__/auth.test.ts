/**
 * Auth Middleware Integration Tests
 *
 * Verifies that requireAuth correctly rejects invalid, expired,
 * and malformed tokens.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-that-is-long-enough-for-testing';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    tenant: { findUnique: vi.fn() },
  },
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

vi.mock('../lib/queue.js', () => ({
  getQueue: vi.fn().mockReturnValue({ add: vi.fn() }),
  getQueueStats: vi.fn().mockResolvedValue({}),
  QUEUE_NAMES: { BILLING_METER: 'billing-meter', WEBHOOK_RETRY: 'webhook-retry', DOCUMENT_EXPIRY: 'document-expiry' },
  redisConnection: {},
  defaultJobOptions: {},
}));

vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_ACCESS_SECRET: JWT_SECRET,
    JWT_REFRESH_SECRET: JWT_SECRET,
    REDIS_URL: 'redis://localhost:6379',
    SLOW_QUERY_THRESHOLD_MS: 500,
    LOG_LEVEL: 'error',
    COOKIE_SECRET: 'test-cookie-secret-1234',
    COOKIE_DOMAIN: 'localhost',
  },
  isDev: false,
  isProd: false,
}));

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

let app: express.Express;

beforeAll(async () => {
  const { requireAuth } = await import('../middleware/auth.js');
  const { errorHandler } = await import('../middleware/errorHandler.js');

  app = express();
  app.use(express.json());
  app.get('/protected', requireAuth, (req: any, res) => {
    res.json({ success: true, userId: req.auth.userId });
  });
  app.use(errorHandler);
});

describe('Auth Middleware', () => {
  it('rejects request with no Authorization header', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects request with non-Bearer Authorization header', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
  });

  it('rejects request with a malformed JWT', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  it('rejects request with an expired JWT', async () => {
    const expiredToken = jwt.sign(
      { userId: 'user-1', tenantId: 'tenant-1', isSuperAdmin: false },
      JWT_SECRET,
      { expiresIn: -1 }, // already expired
    );

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('rejects JWT signed with wrong secret', async () => {
    const wrongToken = jwt.sign(
      { userId: 'user-1', tenantId: 'tenant-1', isSuperAdmin: false },
      'wrong-secret-key-that-is-not-the-real-one',
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${wrongToken}`);
    expect(res.status).toBe(401);
  });

  it('accepts a valid JWT and sets req.auth', async () => {
    const token = jwt.sign(
      { userId: 'user-1', tenantId: 'tenant-1', isSuperAdmin: false },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-1');
  });
});
