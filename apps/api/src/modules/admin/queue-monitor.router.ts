/**
 * Queue Monitor Admin Router
 *
 * Super Admin only endpoints for inspecting BullMQ queues.
 *
 * GET  /api/v1/admin/queues              — List all queues with stats
 * GET  /api/v1/admin/queues/:queue/failed — List failed jobs (DLQ)
 * POST /api/v1/admin/queues/:queue/failed/:jobId/retry — Retry a failed job
 * DELETE /api/v1/admin/queues/:queue/failed/:jobId    — Discard a failed job
 */

import { Router, type Request, type Response } from 'express';
import { getQueue, getQueueStats, QUEUE_NAMES, type QueueName } from '../../lib/queue.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { AppError } from '../../lib/errors.js';

export const queueMonitorRouter = Router();

const VALID_QUEUES: QueueName[] = [
  QUEUE_NAMES.BILLING_METER,
  QUEUE_NAMES.WEBHOOK_RETRY,
  QUEUE_NAMES.DOCUMENT_EXPIRY,
];

function validateQueue(name: string): QueueName {
  if (!VALID_QUEUES.includes(name as QueueName)) {
    throw AppError.notFound(`Queue '${name}' not found. Valid queues: ${VALID_QUEUES.join(', ')}`);
  }
  return name as QueueName;
}

// ─── GET /admin/queues — All queue stats ──────────────────────────────────────

queueMonitorRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await Promise.all(VALID_QUEUES.map((name) => getQueueStats(name)));

    res.json({
      success: true,
      data: {
        queues: stats,
        timestamp: new Date().toISOString(),
      },
    });
  }),
);

// ─── GET /admin/queues/:queue/failed — Failed jobs ────────────────────────────

queueMonitorRouter.get(
  '/:queue/failed',
  asyncHandler(async (req: Request, res: Response) => {
    const queueName = validateQueue(req.params['queue'] as string);
    const queue = getQueue(queueName);

    const page = Math.max(0, parseInt(req.query.page as string || '0', 10));
    const limit = Math.min(50, parseInt(req.query.limit as string || '20', 10));

    const failedJobs = await queue.getFailed(page * limit, page * limit + limit - 1);

    const data = failedJobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace?.[0] ?? null,
      attemptsMade: job.attemptsMade,
      timestamp: new Date(job.timestamp).toISOString(),
      processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
    }));

    res.json({
      success: true,
      data: {
        queue: queueName,
        jobs: data,
        total: await queue.getFailedCount(),
        page,
        limit,
      },
    });
  }),
);

// ─── POST /admin/queues/:queue/failed/:jobId/retry — Retry a failed job ──────

queueMonitorRouter.post(
  '/:queue/failed/:jobId/retry',
  asyncHandler(async (req: Request, res: Response) => {
    const queueName = validateQueue(req.params['queue'] as string);
    const jobId = req.params['jobId'] as string;
    const queue = getQueue(queueName);

    const job = await queue.getJob(jobId!);
    if (!job) {
      throw AppError.notFound(`Job '${jobId}' not found in queue '${queueName}'`);
    }

    await job.retry('failed');

    res.json({
      success: true,
      message: `Job '${jobId}' has been queued for retry`,
      data: { jobId, queue: queueName },
    });
  }),
);

// ─── DELETE /admin/queues/:queue/failed/:jobId — Discard a failed job ────────

queueMonitorRouter.delete(
  '/:queue/failed/:jobId',
  asyncHandler(async (req: Request, res: Response) => {
    const queueName = validateQueue(req.params['queue'] as string);
    const jobId = req.params['jobId'] as string;
    const queue = getQueue(queueName);

    const job = await queue.getJob(jobId!);
    if (!job) {
      throw AppError.notFound(`Job '${jobId}' not found in queue '${queueName}'`);
    }

    await job.remove();

    res.json({
      success: true,
      message: `Job '${jobId}' has been removed from queue '${queueName}'`,
    });
  }),
);

// ─── POST /admin/queues/:queue/pause — Pause a queue ─────────────────────────

queueMonitorRouter.post(
  '/:queue/pause',
  asyncHandler(async (req: Request, res: Response) => {
    const queueName = validateQueue(req.params['queue'] as string);
    const queue = getQueue(queueName);
    await queue.pause();
    res.json({ success: true, message: `Queue '${queueName}' paused` });
  }),
);

// ─── POST /admin/queues/:queue/resume — Resume a paused queue ────────────────

queueMonitorRouter.post(
  '/:queue/resume',
  asyncHandler(async (req: Request, res: Response) => {
    const queueName = validateQueue(req.params['queue'] as string);
    const queue = getQueue(queueName);
    await queue.resume();
    res.json({ success: true, message: `Queue '${queueName}' resumed` });
  }),
);
