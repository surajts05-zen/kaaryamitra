import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../../lib/prisma.js';
import { WebhookEventType } from '@prisma/client';
import { logger } from '../../lib/logger.js';
import { dispatchToSlack } from '../integrations/adapters/slack.adapter.js';

export async function dispatchWebhook(tenantId: string, event: WebhookEventType, payload: any) {
  try {
    // Internal Integrations Hook
    dispatchToSlack(tenantId, event, payload).catch(err => logger.error({ err }, 'Slack adapter failed'));

    // Find all active endpoints for this tenant that are subscribed to this event
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event }
      }
    });

    if (endpoints.length === 0) return;

    const dispatchTime = new Date().toISOString();
    const finalPayload = {
      event,
      timestamp: dispatchTime,
      data: payload
    };

    const payloadString = JSON.stringify(finalPayload);

    // For each endpoint, create a delivery record and try to send
    for (const endpoint of endpoints) {
      const signature = crypto
        .createHmac('sha256', endpoint.secret)
        .update(payloadString)
        .digest('hex');

      const delivery = await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload: finalPayload,
        }
      });

      // Send asynchronously so we don't block the main request
      sendWebhook(endpoint, delivery.id, finalPayload, signature).catch(err => {
        logger.error(`Failed to dispatch webhook ${delivery.id}: ${err.message}`);
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error dispatching webhooks:');
  }
}

async function sendWebhook(endpoint: any, deliveryId: string, payload: any, signature: string) {
  try {
    const response = await axios.post(endpoint.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-KM-Signature': `sha256=${signature}`,
        'X-KM-Delivery-Id': deliveryId,
        'X-KM-Event': payload.event,
        ...(endpoint.headers as Record<string, string>),
      },
      timeout: 10000, // 10s timeout
    });

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        responseStatus: response.status,
        responseBody: typeof response.data === 'string' ? response.data.substring(0, 1000) : JSON.stringify(response.data).substring(0, 1000),
        deliveredAt: new Date(),
        attemptCount: 1,
      }
    });
  } catch (error: any) {
    // Schedule for retry
    const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins for first retry
    
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'RETRYING',
        responseStatus: error.response?.status || 500,
        responseBody: error.message,
        attemptCount: 1,
        nextRetryAt,
      }
    });
  }
}
