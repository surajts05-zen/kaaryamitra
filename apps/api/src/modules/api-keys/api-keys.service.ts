import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class ApiKeysService {
  /**
   * Generates a new API key and stores its hash
   * @returns The raw key (to be shown only once) and the created record
   */
  async createKey(tenantId: string, userId: string, data: { name: string; scopes: string[]; expiresAt?: Date | null }) {
    // 1. Generate 32 bytes of randomness and encode as hex (64 chars)
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const rawKey = `km_live_${rawSecret}`;
    
    // 2. Extract prefix for display (km_live_ + first 8 chars of secret)
    const keyPrefix = `km_live_${rawSecret.substring(0, 8)}`;
    
    // 3. Hash the entire key using bcrypt (same as passwords)
    const keyHash = await bcrypt.hash(rawKey, 10);
    
    // 4. Store in DB
    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId,
        name: data.name,
        keyHash,
        keyPrefix,
        scopes: data.scopes,
        expiresAt: data.expiresAt || null,
        createdByUserId: userId,
      },
    });

    // Log creation
    await prisma.apiKeyAuditLog.create({
      data: {
        apiKeyId: apiKey.id,
        action: 'CREATED',
      },
    });

    // Return the raw key so the frontend can display it ONCE
    return { apiKey, rawKey };
  }

  async listKeys(tenantId: string) {
    return prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateKey(tenantId: string, id: string, data: { name?: string; scopes?: string[]; expiresAt?: Date | null; status?: 'ACTIVE' | 'REVOKED' | 'EXPIRED' }) {
    const key = await prisma.apiKey.findFirst({
      where: { id, tenantId },
    });

    if (!key) throw AppError.notFound('API key not found');
    
    // If status changing to revoked, log it
    if (data.status === 'REVOKED' && key.status !== 'REVOKED') {
      await prisma.apiKeyAuditLog.create({
        data: {
          apiKeyId: id,
          action: 'REVOKED',
        },
      });
    }

    return prisma.apiKey.update({
      where: { id },
      data,
    });
  }

  async deleteKey(tenantId: string, id: string) {
    const key = await prisma.apiKey.findFirst({
      where: { id, tenantId },
    });

    if (!key) throw AppError.notFound('API key not found');

    // Log revocation before deleting
    await prisma.apiKeyAuditLog.create({
      data: {
        apiKeyId: id,
        action: 'REVOKED',
      },
    });

    // Hard-delete so revoked keys don't clutter the list
    await prisma.apiKey.delete({ where: { id } });
  }

  async getAuditLogs(tenantId: string, apiKeyId: string) {
    // Verify key belongs to tenant
    const key = await prisma.apiKey.findFirst({
      where: { id: apiKeyId, tenantId },
    });

    if (!key) throw AppError.notFound('API key not found');

    return prisma.apiKeyAuditLog.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100
    });
  }
}
