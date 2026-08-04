/**
 * 🟠 CORE | Database Client
 * 
 * Prisma ORM client singleton. Uses globalThis to prevent multiple
 * PrismaClient instances during hot reloading in development.
 * 
 * Used by: app/api/* (all backend API routes)
 * Category: Core
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prismaClient: PrismaClient | undefined
  prismaPartner: PrismaClient | undefined
}

export const dbClient =
  globalForPrisma.prismaClient ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.CLIENT_DATABASE_URL || "file:../db/client.db",
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

export const dbPartner =
  globalForPrisma.prismaPartner ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.PARTNER_DATABASE_URL || "file:../db/partner.db",
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaClient = dbClient
  globalForPrisma.prismaPartner = dbPartner
}

// For backward compatibility or general access, export db as dbClient
export const db = dbClient;

export { firestoreDb } from './firestore-db';