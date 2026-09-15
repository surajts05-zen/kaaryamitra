/**
 * Document Expiry Job — migrated from inline cron call to BullMQ repeatable job.
 *
 * Runs daily to notify employees of upcoming document expirations
 * at 30, 7, 1 days and expire documents on the day they expire.
 */

import { Worker, type Job } from 'bullmq';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { createNotification } from '../modules/notifications/notification.service.js';
import { getQueue, redisConnection, QUEUE_NAMES, defaultJobOptions } from '../lib/queue.js';

// ─── Job processor ────────────────────────────────────────────────────────────

export async function checkDocumentExpiries(_job?: Job) {
  logger.info('[DocumentExpiryJob] Running daily document expiry check...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Targets: 30 days, 7 days, 1 day, and 0 days (expired today)
  const targetDays = [30, 7, 1, 0];

  for (const days of targetDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);

    const docs = await prisma.document.findMany({
      where: {
        status: 'VALID',
        expiresAt: targetDate,
      },
      include: {
        employee: { select: { userId: true, firstName: true, lastName: true } },
        category: true,
      },
    });

    for (const doc of docs) {
      const type = days === 0 ? 'EXPIRED' : 'EXPIRING';
      const title = `Document ${type}: ${doc.title}`;
      const body =
        days === 0
          ? `Your document "${doc.title}" (${doc.category.name}) has expired today. Please upload a new version.`
          : `Your document "${doc.title}" (${doc.category.name}) is expiring in ${days} day(s).`;

      await createNotification({
        tenantId: doc.tenantId,
        userId: doc.employee.userId,
        type: 'document.expiry' as any,
        title,
        body,
        link: `/app/me/profile?tab=documents`,
      });
    }

    // Update status to EXPIRED for docs expiring today
    if (days === 0 && docs.length > 0) {
      await prisma.document.updateMany({
        where: {
          id: { in: docs.map((d: any) => d.id) },
        },
        data: {
          status: 'EXPIRED',
        },
      });
    }
  }

  logger.info('[DocumentExpiryJob] Finished document expiry check.');
}

// ─── Register repeatable job + worker ─────────────────────────────────────────

export function initDocumentExpiryJob() {
  const queue = getQueue(QUEUE_NAMES.DOCUMENT_EXPIRY);

  // Run daily at 7 AM (catches users before working hours)
  queue
    .upsertJobScheduler(
      'document-expiry-daily',
      { pattern: '0 7 * * *' },
      {
        name: 'document-expiry',
        opts: defaultJobOptions,
      },
    )
    .catch((err) =>
      logger.error({ err }, '[DocumentExpiryJob] Failed to register repeatable job'),
    );

  const worker = new Worker(QUEUE_NAMES.DOCUMENT_EXPIRY, checkDocumentExpiries, {
    connection: redisConnection,
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    logger.info(`[DocumentExpiryJob] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, '[DocumentExpiryJob] Job failed');
  });

  logger.info('[DocumentExpiryJob] Registered and worker started');
}
