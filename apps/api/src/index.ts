import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { connectDatabase, disconnectDatabase } from './lib/prisma.js';
import { startWebhookRetryJob } from './jobs/webhook-retry.job.js';
import { initDocumentExpiryJob } from './jobs/document-expiry.job.js';
import { closeAllQueues } from './lib/queue.js';
import { loadRazorpaySettings } from './modules/billing/razorpay.service.js';

async function main() {
  logger.info(`🚀 Starting KaaryaMitra API (${env.NODE_ENV})`);

  // Connect to database
  await connectDatabase();

  // Load Platform Settings
  try {
    await loadRazorpaySettings();
    logger.info('✅ Razorpay settings loaded');
  } catch (err) {
    logger.warn({ err }, '⚠️ Could not load Razorpay settings on startup');
  }

  const app = createApp();

  // Start background BullMQ jobs
  // Note: billing-meter is started inside createApp() via initBillingMeterJob()
  startWebhookRetryJob();
  initDocumentExpiryJob();

  const server = app.listen(env.PORT, () => {
    logger.info(`✅ Server listening on http://localhost:${env.PORT}`);
    logger.info(`📋 Health: http://localhost:${env.PORT}/health`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      // Close all BullMQ queues before disconnecting DB
      await closeAllQueues();
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });

    // Force exit if server doesn't close in 15 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
