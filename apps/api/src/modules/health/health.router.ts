/**
 * Health Check Router
 *
 * GET /health        — Full health check (DB + Redis + queues + memory)
 * GET /health/live   — Liveness probe (is the process alive?)
 * GET /health/ready  — Readiness probe (is it ready to serve traffic?)
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { createClient } from 'redis';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { getQueueStats, QUEUE_NAMES } from '../../lib/queue.js';
import { logger } from '../../lib/logger.js';

export const healthRouter = Router();

// ─── Redis health probe ───────────────────────────────────────────────────────

let healthRedisClient: ReturnType<typeof createClient> | null = null;

function getHealthRedis() {
  if (!healthRedisClient) {
    healthRedisClient = createClient({ url: env.REDIS_URL });
    healthRedisClient.on('error', (err: Error) => {
      logger.debug({ err: err.message }, '[Health] Redis probe error');
    });
    healthRedisClient.connect().catch((err: Error) => {
      logger.debug({ err: err.message }, '[Health] Redis connect failed');
    });
  }
  return healthRedisClient;
}

// ─── Full health check ────────────────────────────────────────────────────────

healthRouter.get('/', async (_req: Request, res: Response) => {
  const startTime = Date.now();

  // ── DB check ──────────────────────────────────────────────────────────────
  let dbStatus: 'ok' | 'error' = 'ok';
  let dbLatencyMs: number | null = null;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = 'error';
  }

  // ── Redis check ───────────────────────────────────────────────────────────
  let redisStatus: 'ok' | 'error' = 'ok';
  let redisLatencyMs: number | null = null;
  try {
    const redisStart = Date.now();
    await getHealthRedis().ping();
    redisLatencyMs = Date.now() - redisStart;
  } catch {
    redisStatus = 'error';
  }

  // ── Queue stats ───────────────────────────────────────────────────────────
  let queues: Record<string, unknown> = {};
  try {
    const [billingStats, webhookStats, docStats] = await Promise.all([
      getQueueStats(QUEUE_NAMES.BILLING_METER),
      getQueueStats(QUEUE_NAMES.WEBHOOK_RETRY),
      getQueueStats(QUEUE_NAMES.DOCUMENT_EXPIRY),
    ]);
    queues = {
      [QUEUE_NAMES.BILLING_METER]: billingStats,
      [QUEUE_NAMES.WEBHOOK_RETRY]: webhookStats,
      [QUEUE_NAMES.DOCUMENT_EXPIRY]: docStats,
    };
  } catch {
    queues = { error: 'Could not fetch queue stats' };
  }

  // ── Memory ────────────────────────────────────────────────────────────────
  const mem = process.memoryUsage();
  const memory = {
    rssM: Math.round(mem.rss / 1024 / 1024),
    heapUsedM: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalM: Math.round(mem.heapTotal / 1024 / 1024),
  };

  const isHealthy = dbStatus === 'ok' && redisStatus === 'ok';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: process.env['npm_package_version'] ?? '1.0.0',
    responseTimeMs: Date.now() - startTime,
    services: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      redis: { status: redisStatus, latencyMs: redisLatencyMs },
    },
    queues,
    memory,
  });
});

// ─── Liveness probe (Dokploy / k8s: is the process alive?) ───────────────────

healthRouter.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// ─── Readiness probe (Dokploy: is it ready to serve?) ────────────────────────

healthRouter.get('/ready', async (_req: Request, res: Response) => {
  let dbOk = false;
  let redisOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch { /* not ready */ }

  try {
    await getHealthRedis().ping();
    redisOk = true;
  } catch { /* not ready */ }

  const ready = dbOk && redisOk;

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: { database: dbOk, redis: redisOk },
  });
});
