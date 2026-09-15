/**
 * Webhook Retry Job — migrated from node-cron to BullMQ repeatable job.
 *
 * Runs every 5 minutes to retry failed webhook deliveries using
 * exponential backoff: 5m → 30m → 2h → 24h.
 *
 * Failed deliveries that exhaust all attempts are marked FAILED and
 * logged with full error context for manual investigation.
 */

import { Worker, type Job } from 'bullmq';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { getQueue, redisConnection, QUEUE_NAMES, defaultJobOptions } from '../lib/queue.js';

// Exponential backoff strategy in minutes: 5m, 30m, 2h, 24h
const RETRY_DELAYS_MINUTES = [5, 30, 120, 1440];
const MAX_ATTEMPTS = 5; // Initial + 4 retries

// ─── Job processor ────────────────────────────────────────────────────────────

async function processWebhookRetry(_job: Job) {
  const pendingDeliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: 'RETRYING',
      nextRetryAt: { lte: new Date() },
      attemptCount: { lt: MAX_ATTEMPTS },
    },
    include: {
      endpoint: true,
    },
  });

  if (pendingDeliveries.length === 0) return;

  logger.info(`[WebhookRetryJob] Found ${pendingDeliveries.length} webhooks to retry`);

  for (const delivery of pendingDeliveries) {
    const { endpoint, payload, attemptCount } = delivery;

    // Ensure endpoint is still active
    if (!endpoint.isActive) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: 'FAILED' },
      });
      continue;
    }

    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(payloadString)
      .digest('hex');

    try {
      const response = await axios.post(endpoint.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-KM-Signature': `sha256=${signature}`,
          'X-KM-Delivery-Id': delivery.id,
          'X-KM-Event': (payload as any).event,
          ...(endpoint.headers as Record<string, string>),
        },
        timeout: 10000,
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'DELIVERED',
          responseStatus: response.status,
          responseBody:
            typeof response.data === 'string'
              ? response.data.substring(0, 1000)
              : JSON.stringify(response.data).substring(0, 1000),
          deliveredAt: new Date(),
          attemptCount: attemptCount + 1,
        },
      });
    } catch (error: any) {
      const newAttemptCount = attemptCount + 1;

      if (newAttemptCount >= MAX_ATTEMPTS) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            responseStatus: error.response?.status || 500,
            responseBody: error.message,
            attemptCount: newAttemptCount,
          },
        });

        logger.warn(
          { deliveryId: delivery.id, endpointUrl: endpoint.url },
          '[WebhookRetryJob] Delivery permanently failed after max attempts',
        );
      } else {
        const delayMinutes = RETRY_DELAYS_MINUTES[newAttemptCount - 1] || 1440;
        const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            responseStatus: error.response?.status || 500,
            responseBody: error.message,
            attemptCount: newAttemptCount,
            nextRetryAt,
          },
        });
      }
    }
  }
}

// ─── Register repeatable job + worker ─────────────────────────────────────────

export function startWebhookRetryJob() {
  const queue = getQueue(QUEUE_NAMES.WEBHOOK_RETRY);

  // Register every-5-minutes repeatable job
  queue
    .upsertJobScheduler(
      'webhook-retry-interval',
      { pattern: '*/5 * * * *' },
      {
        name: 'webhook-retry',
        opts: defaultJobOptions,
      },
    )
    .catch((err) =>
      logger.error({ err }, '[WebhookRetryJob] Failed to register repeatable job'),
    );

  // Start the worker
  const worker = new Worker(QUEUE_NAMES.WEBHOOK_RETRY, processWebhookRetry, {
    connection: redisConnection,
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    logger.info(`[WebhookRetryJob] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, '[WebhookRetryJob] Job failed');
  });

  logger.info('[WebhookRetryJob] Registered and worker started');
}
