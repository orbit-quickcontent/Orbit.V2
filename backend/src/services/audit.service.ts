import { firestoreDb } from "./firestore-db";

export interface AuditLogParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string | Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  req?: any;
}

/**
 * Log general platform and state machine events into the audit log.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const detailsStr =
      typeof params.details === "string" ? params.details : JSON.stringify(params.details || {});

    await firestoreDb.clientAuditLogs.create({
      data: {
        userId: params.userId || "system",
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: detailsStr,
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    // Audit logging is non-blocking
  }
}

/**
 * Log banking and payout related actions into the system audit log.
 */
export async function logBankAudit(params: {
  userId: string;
  partnerId: string;
  action: "BANK_ADDED" | "VERIFICATION_SUCCESS" | "VERIFICATION_FAILURE" | "BANK_UPDATED" | "PAYOUT_INITIATED" | "PAYOUT_COMPLETED" | "PAYOUT_FAILED";
  details?: Record<string, any>;
  req?: any;
}) {
  await logAudit({
    userId: params.userId,
    action: params.action,
    entity: "PartnerBankAccount",
    entityId: params.partnerId,
    details: params.details,
    req: params.req,
  });
}
