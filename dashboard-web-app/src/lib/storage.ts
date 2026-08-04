import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Enable S3 client if credentials are configured
const isS3Configured = !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_S3_BUCKET_NAME);

let s3Client: S3Client | null = null;

if (isS3Configured) {
  s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID!,
      secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
  });
  console.log("[Storage] S3 cloud storage initialized successfully");
} else {
  console.warn("[Storage] AWS credentials missing. Falling back to local disk storage");
}

function checkS3Config() {
  if (!isS3Configured || !s3Client) {
    const isProductionOrBeta = process.env.NODE_ENV === "production" || process.env.PRODUCTION_BETA === "true";
    if (isProductionOrBeta) {
      throw new Error("[Storage] Critical Configuration Error: AWS credentials missing in production/beta mode. S3 setup is required.");
    }
  }
}

/**
 * Generate a presigned PUT URL for client-side upload.
 */
export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
  }

  checkS3Config();
  // Fallback to local mock upload route
  return `/api/upload/mock-s3?key=${encodeURIComponent(key)}`;
}

/**
 * Generate a presigned GET URL for secure media access.
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  if (isS3Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 86400 }); // 24 hours expiry
  }

  checkS3Config();
  // Fallback to public path if local upload
  return `/upload/${key}`;
}

/**
 * Directly upload an in-memory buffer to storage.
 */
export async function uploadFileToStorage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return await getPresignedDownloadUrl(key);
  }

  checkS3Config();
  // Fallback to local file saving
  const fs = require("fs").promises;
  const path = require("path");
  const targetFilePath = path.join(process.cwd(), "public", "upload", key);
  const targetDir = path.dirname(targetFilePath);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetFilePath, buffer);

  return `/upload/${key}`;
}
