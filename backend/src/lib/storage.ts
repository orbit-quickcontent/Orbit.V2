import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

function getBucket() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    throw new Error('Firebase Storage is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and FIREBASE_STORAGE_BUCKET.');
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  }

  return getStorage().bucket(storageBucket);
}

function safeKey(key: string): string {
  const normalized = String(key || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid storage object key');
  }
  return normalized;
}

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const file = getBucket().file(safeKey(key));
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType: contentType || 'application/octet-stream',
  });
  return url;
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const file = getBucket().file(safeKey(key));
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  });
  return url;
}

export async function uploadFileToStorage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const file = getBucket().file(safeKey(key));
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: contentType || 'application/octet-stream',
      cacheControl: 'private, max-age=0, no-store',
    },
  });
  return getPresignedDownloadUrl(key);
}
