import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

// Singleton pattern — reuse the same PrismaClient across the app
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [
            { emit: 'event', level: 'query' }, // capture slow queries in prod too
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ],
  });

// ── Slow query logger ─────────────────────────────────────────────────────────
// Logs queries that exceed the configured threshold to help identify N+1s and
// missing indexes. Threshold is configurable via SLOW_QUERY_THRESHOLD_MS env.
(prisma as any).$on('query', (e: { query: string; params: string; duration: number }) => {
  if (e.duration >= env.SLOW_QUERY_THRESHOLD_MS) {
    logger.warn(
      {
        query: e.query,
        params: e.params,
        durationMs: e.duration,
        threshold: env.SLOW_QUERY_THRESHOLD_MS,
      },
      `🐢 Slow query detected (${e.duration}ms)`,
    );
  }
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
    logger.info(
      `🔍 Slow query logging enabled (threshold: ${env.SLOW_QUERY_THRESHOLD_MS}ms)`,
    );
  } catch (error) {
    logger.error({ error }, '❌ Database connection failed');
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
