import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../../config/env.js';

// Helper to encrypt secrets before storing
function encryptSecret(text: string): { iv: string; authTag: string; value: string } {
  const masterKey = crypto.scryptSync(env.COOKIE_SECRET, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { iv: iv.toString('hex'), authTag, value: encrypted };
}

export function decryptSecret(iv: string, authTag: string, encryptedValue: string): string {
  const masterKey = crypto.scryptSync(env.COOKIE_SECRET, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class IntegrationsService {
  async listIntegrations(tenantId: string) {
    return prisma.tenantIntegration.findMany({
      where: { tenantId },
      select: {
        id: true,
        provider: true,
        config: true,
        status: true,
        updatedAt: true,
      }
    });
  }

  async configureIntegration(tenantId: string, data: { provider: IntegrationProvider; config: Record<string, any>; secrets?: Record<string, string> | undefined }) {
    // Upsert the integration
    const integration = await prisma.tenantIntegration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: data.provider,
        }
      },
      update: {
        config: data.config,
        status: IntegrationStatus.CONNECTED,
      },
      create: {
        tenantId,
        provider: data.provider,
        config: data.config,
        status: IntegrationStatus.CONNECTED,
      }
    });

    // Handle secrets
    if (data.secrets && Object.keys(data.secrets).length > 0) {
      for (const [key, plainValue] of Object.entries(data.secrets)) {
        const { iv, authTag, value } = encryptSecret(plainValue);
        
        // key format: provider_key
        const secretKey = `${data.provider}_${key}`;

        await prisma.encryptedSecret.upsert({
          where: {
            tenantId_key: {
              tenantId,
              key: secretKey,
            }
          },
          update: {
            value,
            iv,
            authTag,
          },
          create: {
            tenantId,
            key: secretKey,
            value,
            iv,
            authTag,
          }
        });
      }
    }

    return prisma.tenantIntegration.findUnique({
      where: { id: integration.id },
      select: {
        id: true,
        provider: true,
        config: true,
        status: true,
      }
    });
  }

  async updateIntegrationStatus(tenantId: string, id: string, status: IntegrationStatus) {
    const integration = await prisma.tenantIntegration.findFirst({
      where: { id, tenantId },
    });

    if (!integration) throw AppError.notFound('Integration not found');

    return prisma.tenantIntegration.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        provider: true,
        status: true,
      }
    });
  }

  async deleteIntegration(tenantId: string, id: string) {
    const integration = await prisma.tenantIntegration.findFirst({
      where: { id, tenantId },
    });

    if (!integration) throw AppError.notFound('Integration not found');

    await prisma.tenantIntegration.delete({
      where: { id },
    });
  }
}
