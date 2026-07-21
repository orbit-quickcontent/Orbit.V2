import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

export const dbClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CLIENT_DATABASE_URL || "file:../../dashboard-web-app/db/client.db",
    },
  },
});

export const dbPartner = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PARTNER_DATABASE_URL || "file:../../dashboard-web-app/db/partner.db",
    },
  },
});

export const db = dbClient;

export { firestoreDb } from './firestore-db';
