import { logger } from './logger.js';

/**
 * StorageService — S3-compatible storage abstraction.
 * Swap the implementation (AWS S3, MinIO, local) without changing call sites.
 */
export class StorageService {
  /**
   * Upload a file buffer to S3-compatible storage.
   * Returns the public URL or S3 key.
   */
  static async upload(options: {
    key: string;          // e.g. 'tenants/{tenantId}/avatars/{userId}.jpg'
    body: Buffer;
    contentType: string;
    isPublic?: boolean;
  }): Promise<string> {
    // TODO Phase 0 completion: Wire up @aws-sdk/client-s3
    // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
    // const client = new S3Client({ ... });
    // await client.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ... }));
    logger.debug({ key: options.key }, '[STUB] StorageService.upload called');
    return `https://storage.kaaryamitra.com/${options.key}`;
  }

  /**
   * Generate a pre-signed URL for secure private file access.
   */
  static async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    // TODO: Implement getSignedUrl with @aws-sdk/s3-request-presigner
    logger.debug({ key, expiresInSeconds }, '[STUB] StorageService.getSignedUrl called');
    return `https://storage.kaaryamitra.com/${key}?signed=stub&expires=${expiresInSeconds}`;
  }

  /**
   * Delete a file from storage.
   */
  static async delete(key: string): Promise<void> {
    // TODO: Implement DeleteObjectCommand
    logger.debug({ key }, '[STUB] StorageService.delete called');
  }

  /**
   * Build the storage key for a given resource.
   */
  static buildKey(parts: { tenantId: string; module: string; filename: string }): string {
    return `tenants/${parts.tenantId}/${parts.module}/${parts.filename}`;
  }
}
