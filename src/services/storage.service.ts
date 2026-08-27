import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const BUCKET = process.env.NEON_STORAGE_BUCKET || 'mantikole-media';
const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'us-east-2';

const isS3Configured = Boolean(endpoint && accessKeyId && secretAccessKey);

const s3Client = isS3Configured
  ? new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
      forcePathStyle: true, // Required for Neon Object Storage
    })
  : null;

export async function uploadMediaFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folder: string = 'media'
): Promise<{ url: string; key: string }> {
  const sanitizedExt = path.extname(originalFilename) || '.jpg';
  const cleanBase = path
    .basename(originalFilename, sanitizedExt)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  const key = `${folder}/${Date.now()}-${cleanBase}${sanitizedExt}`;

  if (s3Client && isS3Configured) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );

      // Public URL format for Neon Object Storage
      const publicUrl = `${endpoint}/${BUCKET}/${key}`;
      return { url: publicUrl, key };
    } catch (err: any) {
      console.error('Neon Object Storage upload error:', err);
      throw { status: 500, message: `Gagal mengunggah file ke Neon Storage: ${err.message}` };
    }
  }

  // Fallback to local storage if S3 is not available
  const uploadDir = path.join(process.cwd(), 'public/uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, `${Date.now()}-${cleanBase}${sanitizedExt}`);
  fs.writeFileSync(filePath, fileBuffer);

  const localUrl = `/uploads/${folder}/${path.basename(filePath)}`;
  return { url: localUrl, key };
}
