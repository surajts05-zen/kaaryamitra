import cron from 'node-cron';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

// Exponential backoff strategy in minutes: 5m, 30m, 2h, 24h
const RETRY_DELAYS_MINUTES = [5, 30, 120, 1440];
const MAX_ATTEMPTS = 5; // Initial + 4 retries

export function startWebhookRetryJob() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Running webhook retry job...');
    
    try {
      const pendingDeliveries = await prisma.webhookDelivery.findMany({
        where: {
          status: 'RETRYING',
          nextRetryAt: { lte: new Date() },
          attemptCount: { lt: MAX_ATTEMPTS }
        },
        include: {
          endpoint: true
        }
      });

      if (pendingDeliveries.length === 0) return;

      logger.info(`Found ${pendingDeliveries.length} webhooks to retry`);

      for (const delivery of pendingDeliveries) {
        const { endpoint, payload, attemptCount } = delivery;
        
        // Ensure endpoint is still active
        if (!endpoint.isActive) {
          await prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: { status: 'FAILED' }
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
              responseBody: typeof response.data === 'string' ? response.data.substring(0, 1000) : JSON.stringify(response.data).substring(0, 1000),
              deliveredAt: new Date(),
              attemptCount: attemptCount + 1,
            }
          });
        } catch (error: any) {
          const newAttemptCount = attemptCount + 1;
          
          if (newAttemptCount >= MAX_ATTEMPTS) {
            // Mark as failed permanently
            await prisma.webhookDelivery.update({
              where: { id: delivery.id },
              data: {
                status: 'FAILED',
                responseStatus: error.response?.status || 500,
                responseBody: error.message,
                attemptCount: newAttemptCount,
              }
            });
          } else {
            // Schedule next retry
            const delayMinutes = RETRY_DELAYS_MINUTES[newAttemptCount - 1] || 1440;
            const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
            
            await prisma.webhookDelivery.update({
              where: { id: delivery.id },
              data: {
                responseStatus: error.response?.status || 500,
                responseBody: error.message,
                attemptCount: newAttemptCount,
                nextRetryAt,
              }
            });
          }
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error in webhook retry job:');
    }
  });
}
