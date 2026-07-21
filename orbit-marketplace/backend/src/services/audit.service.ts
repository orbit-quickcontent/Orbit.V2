import { NextRequest } from "next/server";
import { logAudit } from "../lib/auth-server";

/**
 * Log banking and payout related actions into the system audit log.
 */
export async function logBankAudit(params: {
  userId: string;
  partnerId: string;
  action: "BANK_ADDED" | "VERIFICATION_SUCCESS" | "VERIFICATION_FAILURE" | "BANK_UPDATED" | "PAYOUT_INITIATED" | "PAYOUT_COMPLETED" | "PAYOUT_FAILED";
  details?: Record<string, any>;
  req?: NextRequest;
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
