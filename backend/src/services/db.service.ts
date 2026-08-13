import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Configure PostgreSQL before starting ORBIT backend.');
}

export const dbClient = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Kept as a backwards-compatible alias while the remaining legacy handlers migrate.
export const dbPartner = dbClient;
export const db = dbClient;

export { firestoreDb } from './firestore-db';
