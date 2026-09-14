import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { WebhookEventType, WebhookDeliveryStatus } from '@prisma/client';

export class WebhooksService {
  async createWebhook(tenantId: string, data: { name: string; url: string; events: WebhookEventType[]; headers?: Record<string, string> | undefined }) {
    // Generate a random signing secret for HMAC
    const secret = crypto.randomBytes(32).toString('hex');

    return prisma.webhookEndpoint.create({
      data: {
        tenantId,
        name: data.name,
        url: data.url,
        events: data.events,
        secret, // We store this plain text here because we need it to sign outbound requests
        headers: data.headers || {},
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        // Secret is returned once on creation
        secret: true,
      }
    });
  }

  async listWebhooks(tenantId: string) {
    return prisma.webhookEndpoint.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { deliveries: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateWebhook(tenantId: string, id: string, data: { name?: string | undefined; url?: string | undefined; events?: WebhookEventType[] | undefined; headers?: Record<string, string> | undefined; isActive?: boolean | undefined }) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
    });

    if (!endpoint) throw AppError.notFound('Webhook endpoint not found');

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.events !== undefined) updateData.events = data.events;
    if (data.headers !== undefined) updateData.headers = data.headers;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.webhookEndpoint.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      }
    });
  }

  async deleteWebhook(tenantId: string, id: string) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
    });

    if (!endpoint) throw AppError.notFound('Webhook endpoint not found');

    return prisma.webhookEndpoint.delete({
      where: { id },
    });
  }

  async revealSecret(tenantId: string, id: string) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
      select: { secret: true }
    });

    if (!endpoint) throw AppError.notFound('Webhook endpoint not found');
    return { secret: endpoint.secret };
  }

  async getDeliveries(tenantId: string, endpointId: string) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });

    if (!endpoint) throw AppError.notFound('Webhook endpoint not found');

    return prisma.webhookDelivery.findMany({
      where: { endpointId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async testWebhook(tenantId: string, id: string) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
    });

    if (!endpoint) throw AppError.notFound('Webhook endpoint not found');

    // Create a dummy payload
    const payload = {
      event: 'CUSTOM',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook from KaaryaMitra' }
    };

    // Calculate HMAC
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const delivery = await prisma.webhookDelivery.create({
      data: {
        endpointId: id,
        event: 'CUSTOM',
        payload,
      }
    });

    try {
      const response = await axios.post(endpoint.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-KM-Signature': `sha256=${signature}`,
          'X-KM-Delivery-Id': delivery.id,
          'X-KM-Event': 'CUSTOM',
          ...(endpoint.headers as Record<string, string>),
        },
        timeout: 5000, // 5s timeout for tests
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'DELIVERED',
          responseStatus: response.status,
          responseBody: typeof response.data === 'string' ? response.data.substring(0, 1000) : JSON.stringify(response.data).substring(0, 1000),
          deliveredAt: new Date(),
          attemptCount: 1,
        }
      });

      return { success: true, status: response.status, data: response.data };
    } catch (error: any) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          responseStatus: error.response?.status || 500,
          responseBody: error.message,
          attemptCount: 1,
        }
      });
      
      throw new AppError(400, 'BAD_REQUEST', 'Test webhook failed', {
        status: error.response?.status,
        message: error.message
      });
    }
  }
}
