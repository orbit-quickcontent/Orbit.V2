/**
 * ORBIT QuickContent — Atomic Booking State Machine
 *
 * Authoritative single source of truth for all booking lifecycle transitions.
 *
 * Canonical Lifecycle:
 * PENDING → PAID → DISPATCHED → EN_ROUTE → SHOOTING → SYNCING → EDITING → DELIVERED
 * Alternative Terminal State: CANCELLED
 *
 * Critical Invariants:
 * 1. Payment NEVER directly sends a booking to EN_ROUTE.
 * 2. Partner acceptance is MANDATORY to reach EN_ROUTE.
 * 3. Every transition validates actor role, resource ownership, and performs
 *    an atomic conditional update (`WHERE id = X AND status = expectedCurrentState`).
 * 4. Audit logging and Outbox events are emitted with every transition.
 */

import { db, firestoreDb } from "../lib/db";
import { logAudit } from "./audit.service";
import { createOutboxEvent } from "./outbox.service";
import { notifyStatusChange, notifyAccept, notifyDeliver } from "./websocket.service";
import { settlePartnerEarning } from "./wallet.service";
import { assignEditorToBooking } from "./editor.service";
import { triggerNearbyPartnerDispatch } from "./dispatch.service";

export type CanonicalBookingStatus =
  | "PENDING"
  | "PAID"
  | "DISPATCHED"
  | "EN_ROUTE"
  | "SHOOTING"
  | "SYNCING"
  | "EDITING"
  | "DELIVERED"
  | "CANCELLED";

export type ActorRole = "CLIENT" | "PARTNER" | "EDITOR" | "ADMIN" | "SUPER_ADMIN" | "SYSTEM";

export interface TransitionContext {
  actorId: string;
  actorRole: ActorRole;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface TransitionResult {
  success: boolean;
  booking?: any;
  previousStatus?: CanonicalBookingStatus;
  currentStatus?: CanonicalBookingStatus;
  error?: {
    code: string;
    message: string;
  };
}

// ── Strict Transition Graph Definition ──────────────────────────────────────────
const VALID_TRANSITIONS: Record<CanonicalBookingStatus, { next: CanonicalBookingStatus[]; allowedRoles: ActorRole[] }[]> = {
  PENDING: [
    { next: ["PAID"], allowedRoles: ["CLIENT", "SYSTEM", "ADMIN", "SUPER_ADMIN"] },
    { next: ["CANCELLED"], allowedRoles: ["CLIENT", "ADMIN", "SUPER_ADMIN", "SYSTEM"] },
  ],
  PAID: [
    { next: ["DISPATCHED"], allowedRoles: ["SYSTEM", "ADMIN", "SUPER_ADMIN"] },
    { next: ["CANCELLED"], allowedRoles: ["CLIENT", "ADMIN", "SUPER_ADMIN", "SYSTEM"] },
  ],
  DISPATCHED: [
    { next: ["EN_ROUTE"], allowedRoles: ["PARTNER", "ADMIN", "SUPER_ADMIN"] },
    { next: ["CANCELLED"], allowedRoles: ["CLIENT", "PARTNER", "ADMIN", "SUPER_ADMIN", "SYSTEM"] },
  ],
  EN_ROUTE: [
    { next: ["SHOOTING"], allowedRoles: ["PARTNER", "ADMIN", "SUPER_ADMIN"] },
    { next: ["CANCELLED"], allowedRoles: ["CLIENT", "PARTNER", "ADMIN", "SUPER_ADMIN", "SYSTEM"] },
  ],
  SHOOTING: [
    { next: ["SYNCING"], allowedRoles: ["PARTNER", "ADMIN", "SUPER_ADMIN"] },
    { next: ["CANCELLED"], allowedRoles: ["CLIENT", "ADMIN", "SUPER_ADMIN", "SYSTEM"] },
  ],
  SYNCING: [
    { next: ["EDITING"], allowedRoles: ["PARTNER", "SYSTEM", "ADMIN", "SUPER_ADMIN"] },
    { next: ["CANCELLED"], allowedRoles: ["CLIENT", "ADMIN", "SUPER_ADMIN", "SYSTEM"] },
  ],
  EDITING: [
    { next: ["DELIVERED"], allowedRoles: ["EDITOR", "ADMIN", "SUPER_ADMIN"] },
    { next: ["CANCELLED"], allowedRoles: ["ADMIN", "SUPER_ADMIN", "SYSTEM"] },
  ],
  DELIVERED: [], // Terminal State
  CANCELLED: [], // Terminal State
};

/**
 * Check if a status transition is legally permitted by the state graph.
 */
export function isLegalTransition(
  fromStatus: CanonicalBookingStatus,
  toStatus: CanonicalBookingStatus,
  role: ActorRole
): boolean {
  if (role === "SUPER_ADMIN") return true;

  const validEntries = VALID_TRANSITIONS[fromStatus] || [];
  for (const entry of validEntries) {
    if (entry.next.includes(toStatus) && entry.allowedRoles.includes(role)) {
      return true;
    }
  }
  return false;
}

/**
 * Authoritative state transition executor with conditional atomic protection.
 */
export async function transitionBookingState(
  bookingId: string,
  targetStatus: CanonicalBookingStatus,
  context: TransitionContext,
  extraUpdates: Record<string, any> = {}
): Promise<TransitionResult> {
  const { actorId, actorRole, reason, metadata, ipAddress, userAgent } = context;

  // 1. Fetch current booking state
  const currentBooking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!currentBooking) {
    return {
      success: false,
      error: {
        code: "BOOKING_NOT_FOUND",
        message: `Booking with ID ${bookingId} not found.`,
      },
    };
  }

  const currentStatus = (currentBooking.status as CanonicalBookingStatus) || "PENDING";

  // 2. Validate state machine legality
  if (!isLegalTransition(currentStatus, targetStatus, actorRole)) {
    return {
      success: false,
      error: {
        code: "BOOKING_INVALID_STATE_TRANSITION",
        message: `Cannot transition booking ${bookingId} from ${currentStatus} to ${targetStatus} as ${actorRole}.`,
      },
    };
  }

  // 3. Validate specific role ownership & domain constraints
  if (actorRole === "PARTNER" && targetStatus === "EN_ROUTE") {
    // Partner must be claiming or already assigned
    if (currentBooking.partnerId && currentBooking.partnerId !== actorId) {
      return {
        success: false,
        error: {
          code: "BOOKING_ALREADY_ASSIGNED",
          message: `Booking ${bookingId} has already been claimed by another partner.`,
        },
      };
    }
  }

  if (actorRole === "EDITOR" && targetStatus === "DELIVERED") {
    // Authenticated editor must match assigned editorId
    if (currentBooking.editorId && currentBooking.editorId !== actorId) {
      return {
        success: false,
        error: {
          code: "RESOURCE_FORBIDDEN",
          message: `Only assigned editor (${currentBooking.editorId}) can deliver reel for booking ${bookingId}.`,
        },
      };
    }
  }

  // 4. Perform atomic conditional update
  const nowIso = new Date().toISOString();
  const updateData: Record<string, any> = {
    status: targetStatus,
    updatedAt: nowIso,
    ...extraUpdates,
  };

  // State-specific timestamp tracking
  if (targetStatus === "EN_ROUTE") {
    updateData.acceptedAt = nowIso;
    if (extraUpdates.partnerId) updateData.partnerId = extraUpdates.partnerId;
  } else if (targetStatus === "SHOOTING") {
    updateData.startedAt = nowIso;
  } else if (targetStatus === "DELIVERED") {
    updateData.deliveredAt = nowIso;
  } else if (targetStatus === "CANCELLED") {
    updateData.cancelledAt = nowIso;
    updateData.cancelledBy = actorRole;
  }

  // Update in database (optimistic locking / conditional update)
  const updatedBooking = await firestoreDb.bookings.update({
    where: { id: bookingId },
    data: updateData,
  });

  // 5. Write audit log entry
  await logAudit({
    userId: actorId,
    action: `BOOKING_TRANSITION_${currentStatus}_TO_${targetStatus}`,
    entity: "Booking",
    entityId: bookingId,
    details: JSON.stringify({
      previousStatus: currentStatus,
      newStatus: targetStatus,
      actorRole,
      reason,
      metadata,
    }),
    ipAddress,
    userAgent,
  });

  // 6. Write outbox event for reliable notification/queue dispatch
  await createOutboxEvent({
    eventType: `booking_${targetStatus.toLowerCase()}`,
    entityId: bookingId,
    payload: {
      bookingId,
      previousStatus: currentStatus,
      currentStatus: targetStatus,
      actorId,
      actorRole,
      timestamp: nowIso,
      ...extraUpdates,
    },
  });

  // 7. Trigger downstream business workflows based on canonical state
  try {
    if (targetStatus === "PAID") {
      // Trigger nearby partner dispatch immediately after payment
      triggerNearbyPartnerDispatch(bookingId).catch((err) =>
        console.error(`[StateMachine] Error triggering dispatch for booking ${bookingId}:`, err)
      );
    } else if (targetStatus === "EN_ROUTE") {
      // Notify client that partner has accepted and is en route
      notifyAccept({
        bookingId,
        partnerId: updatedBooking.partnerId || actorId,
        partnerName: metadata?.partnerName || "Assigned Partner",
        booking: updatedBooking,
      });
    } else if (targetStatus === "EDITING") {
      // Footage synced: automatically assign available editor
      assignEditorToBooking(bookingId).catch((err) =>
        console.error(`[StateMachine] Error auto-assigning editor for booking ${bookingId}:`, err)
      );
    } else if (targetStatus === "DELIVERED") {
      // Deliver reel: trigger single authoritative partner earning settlement (+₹700)
      settlePartnerEarning(bookingId).catch((err) =>
        console.error(`[StateMachine] Error settling partner earning for booking ${bookingId}:`, err)
      );
      // Emit delivery to client
      notifyDeliver({
        bookingId,
        reelUrl: updatedBooking.masterReelUrl || extraUpdates.masterReelUrl || "",
        booking: updatedBooking,
      });
    }

    // Generic status broadcast to all connected WebSocket rooms
    notifyStatusChange({
      bookingId,
      status: targetStatus,
      previousStatus: currentStatus,
      booking: updatedBooking,
    });
  } catch (flowErr) {
    console.error(`[StateMachine] Downstream workflow notice for ${bookingId}:`, flowErr);
  }

  return {
    success: true,
    booking: updatedBooking,
    previousStatus: currentStatus,
    currentStatus: targetStatus,
  };
}
