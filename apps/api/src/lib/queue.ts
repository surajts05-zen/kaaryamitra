/**
 * BullMQ queue factory — centralised setup for all background job queues.
 *
 * All queues share the same Redis connection from REDIS_URL.
 * Workers are created individually in each job file.
 *
 * Dead-letter pattern: jobs that exhaust all attempts are moved to
 * `{queueName}:dlq` for manual inspection / replay via the admin API.
 */

import { Queue, QueueEvents, Worker, type ConnectionOptions } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// ─── Redis connection from env ────────────────────────────────────────────────

function parseRedisUrl(url: string): ConnectionOptions {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      db: parseInt(parsed.pathname?.replace('/', '') || '0', 10) || 0,
      maxRetriesPerRequest: null, // Required by BullMQ
    };
  } catch {
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null };
  }
}

export const redisConnection: ConnectionOptions = parseRedisUrl(env.REDIS_URL);

// ─── Default job options ──────────────────────────────────────────────────────

export const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 5 * 60 * 1000, // 5 minutes base delay
  },
  removeOnComplete: { count: 100 }, // keep last 100 completed jobs
  removeOnFail: { count: 500 },     // keep last 500 failed for DLQ inspection
};

// ─── Queue names (typed constants) ───────────────────────────────────────────

export const QUEUE_NAMES = {
  BILLING_METER: 'billing-meter',
  WEBHOOK_RETRY: 'webhook-retry',
  DOCUMENT_EXPIRY: 'document-expiry',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// ─── Queue registry ───────────────────────────────────────────────────────────

const queueRegistry = new Map<string, Queue>();
const queueEventsRegistry = new Map<string, QueueEvents>();

export function getQueue(name: QueueName): Queue {
  if (!queueRegistry.has(name)) {
    const queue = new Queue(name, {
      connection: redisConnection,
      defaultJobOptions,
    });

    queue.on('error', (err) => {
      logger.error({ err, queue: name }, 'BullMQ queue error');
    });

    queueRegistry.set(name, queue);
    logger.info(`[Queue] Registered queue: ${name}`);
  }
  return queueRegistry.get(name)!;
}

export function getQueueEvents(name: QueueName): QueueEvents {
  if (!queueEventsRegistry.has(name)) {
    const events = new QueueEvents(name, { connection: redisConnection });
    queueEventsRegistry.set(name, events);
  }
  return queueEventsRegistry.get(name)!;
}

// ─── Worker factory ───────────────────────────────────────────────────────────

export function createWorker<T = unknown>(
  name: QueueName,
  processor: ConstructorParameters<typeof Worker<T>>[1],
  concurrency = 1,
): Worker<T> {
  const worker = new Worker<T>(name, processor, {
    connection: redisConnection,
    concurrency,
  });

  worker.on('completed', (job) => {
    logger.info(`[Queue:${name}] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, queue: name }, `[Queue:${name}] Job failed`);
  });

  worker.on('error', (err) => {
    logger.error({ err, queue: name }, `[Queue:${name}] Worker error`);
  });

  return worker;
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

export async function closeAllQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const [name, queue] of queueRegistry) {
    logger.info(`[Queue] Closing queue: ${name}`);
    closePromises.push(queue.close());
  }

  for (const [, events] of queueEventsRegistry) {
    closePromises.push(events.close());
  }

  await Promise.all(closePromises);
  logger.info('[Queue] All queues closed');
}

// ─── Queue stats helper (used by health check + admin monitor) ────────────────

export async function getQueueStats(name: QueueName) {
  const queue = getQueue(name);
  const [active, waiting, failed, completed, delayed] = await Promise.all([
    queue.getActiveCount(),
    queue.getWaitingCount(),
    queue.getFailedCount(),
    queue.getCompletedCount(),
    queue.getDelayedCount(),
  ]);

  return { name, active, waiting, failed, completed, delayed };
}
