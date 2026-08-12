import { getToken } from "next-auth/jwt";
import { requestContextStorage } from "../services/context";
import { firestoreDb } from "./db";
import { NextRequest } from "next/server";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Get authenticated user session on the server.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = requestContextStorage.getStore();
  if (!store || !store.nextRequest) {
    return null;
  }

  try {
    const token = await getToken({
      req: store.nextRequest,
      secret: process.env.NEXTAUTH_SECRET || "orbit-super-secret-jwt-key"
    });

    if (!token) return null;
    return {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
      role: token.role as string
    };
  } catch (err) {
    console.error("[Auth] Error parsing session token:", err);
    return null;
  }
}

/**
 * Require a specific role or list of roles.
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]`);
  }
  return user;
}

/**
 * Create a secure system audit log.
 */
export async function logAudit(params: {
  userId: string | null;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  req?: NextRequest;
}) {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (params.req) {
      ipAddress = params.req.headers.get("x-forwarded-for") || params.req.headers.get("x-real-ip");
      userAgent = params.req.headers.get("user-agent");
    }

    let targetCollection = firestoreDb.clientAuditLogs;
    if (params.userId) {
      const userIsPartner = await firestoreDb.partnerUsers.findUnique({
        where: { id: params.userId },
      });
      if (userIsPartner) {
        targetCollection = firestoreDb.partnerAuditLogs;
      }
    }

    await targetCollection.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}
