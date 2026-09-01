import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger.js';
import { env } from '../config/env.js';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env.S3_BUCKET || 'kaaryamitra-dev';

/**
 * StorageService — S3-compatible storage abstraction.
 */
export class StorageService {
  /**
   * Upload a file buffer to S3-compatible storage.
   * Returns the S3 key.
   */
  static async upload(options: {
    key: string;          
    body: Buffer;
    contentType: string;
    isPublic?: boolean;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      // For local MinIO, ACL might not be supported without configuration,
      // so we rely on presigned URLs or bucket policies for access control.
    });

    await s3Client.send(command);
    logger.debug({ key: options.key }, 'StorageService.upload completed');
    return options.key;
  }

  /**
   * Generate a pre-signed URL for secure private file access.
   */
  static async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    logger.debug({ key, expiresInSeconds }, 'StorageService.getSignedUrl completed');
    return url;
  }

  /**
   * Delete a file from storage.
   */
  static async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await s3Client.send(command);
    logger.debug({ key }, 'StorageService.delete completed');
  }

  /**
   * Build the storage key for a given resource.
   */
  static buildKey(parts: { tenantId: string; module: string; filename: string }): string {
    return `tenants/${parts.tenantId}/${parts.module}/${parts.filename}`;
  }
}
