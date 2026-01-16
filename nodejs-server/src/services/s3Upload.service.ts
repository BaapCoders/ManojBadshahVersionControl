import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import crypto from 'crypto';

/**
 * AWS S3 Upload Service for Design Version Previews
 * Handles PNG uploads and retrieval from S3
 */

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload PNG buffer to S3 and return public URL
 * @param buffer - PNG image buffer
 * @param designId - Design ID for organizing files
 * @param versionNumber - Version number
 * @returns Upload result with URL
 */
export const uploadVersionPNG = async (
  buffer: Buffer,
  designId: number,
  versionNumber: number
): Promise<UploadResult> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const key = `designs/${designId}/versions/v${versionNumber}-${timestamp}-${hash}.png`;

    console.log(`📤 Uploading to S3: ${key}`);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });

    await s3Client.send(command);

    // Generate public URL (assuming bucket is public or has proper permissions)
    const url = `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;

    console.log(`✅ Uploaded successfully: ${url}`);

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Generate a presigned URL for temporary access (if bucket is private)
 * @param key - S3 object key
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export const generatePresignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('❌ Failed to generate presigned URL:', error);
    throw error;
  }
};

/**
 * Upload base64 PNG string to S3
 * @param base64String - Base64 encoded PNG (with or without data:image/png;base64, prefix)
 * @param designId - Design ID
 * @param versionNumber - Version number
 * @returns Upload result with URL
 */
export const uploadBase64PNG = async (
  base64String: string,
  designId: number,
  versionNumber: number
): Promise<UploadResult> => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/png;base64,/, '');
    
    // Convert to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    return await uploadVersionPNG(buffer, designId, versionNumber);
  } catch (error) {
    console.error('❌ Base64 upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
