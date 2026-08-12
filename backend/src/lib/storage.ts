export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  // Direct local mock upload fallback URL
  return `/api/upload/mock-s3?key=${encodeURIComponent(key)}`;
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  // Direct local file path fallback
  return `/upload/${key}`;
}

export async function uploadFileToStorage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const fs = require("fs").promises;
  const path = require("path");
  const targetFilePath = path.join(process.cwd(), "..", "dashboard-web-app", "public", "upload", key);
  const targetDir = path.dirname(targetFilePath);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetFilePath, buffer);

  return `/upload/${key}`;
}
