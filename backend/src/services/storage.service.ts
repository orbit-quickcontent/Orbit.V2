import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

function bucket() {
  const apps = getApps();
  if (!apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin storage is not configured');
    }
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._/-]/g, '_').replace(/\.\.+/g, '.');
}

export async function createUploadUrl(key: string, contentType: string, expiresMinutes = 15): Promise<string> {
  const object = bucket().file(safeName(key));
  const [url] = await object.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresMinutes * 60 * 1000,
    contentType,
  });
  return url;
}

export async function createDownloadUrl(key: string, expiresMinutes = 60): Promise<string> {
  const object = bucket().file(safeName(key));
  const [url] = await object.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresMinutes * 60 * 1000,
  });
  return url;
}

export async function deleteObject(key: string): Promise<void> {
  await bucket().file(safeName(key)).delete({ ignoreNotFound: true });
}
