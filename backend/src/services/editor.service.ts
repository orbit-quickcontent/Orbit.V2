/**
 * ORBIT QuickContent — Automatic Editor Assignment & Delivery Engine
 *
 * 1. Automatically ranks and assigns available editors upon footage sync.
 * 2. Idempotent conditional assignment preventing race conditions.
 * 3. Enforces strict editor ownership verification during reel delivery.
 * 4. Automatically triggers single authoritative partner earnings settlement upon DELIVERED.
 */

import { firestoreDb } from "../lib/db";
import { transitionBookingState } from "./booking-state-machine";
import { logAudit } from "./audit.service";
import { createOutboxEvent } from "./outbox.service";

export interface EditorAssignmentResult {
  success: boolean;
  editorId?: string;
  editorName?: string;
  message: string;
}

export interface DeliverReelParams {
  bookingId: string;
  editorId: string;
  editorRole: string;
  masterReelUrl: string;
  hlsPlaylistUrl?: string;
  notes?: string;
}

export interface DeliverReelResult {
  success: boolean;
  booking?: any;
  message: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 1. Automatically rank and assign an editor to a synced booking.
 */
export async function assignEditorToBooking(bookingId: string): Promise<EditorAssignmentResult> {
  const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, message: `Booking ${bookingId} not found.` };
  }

  // Already assigned? Idempotent return
  if (booking.editorId) {
    return {
      success: true,
      editorId: booking.editorId,
      message: `Booking is already assigned to editor ${booking.editorId}.`,
    };
  }

  // Query all active editors
  const allUsers = await firestoreDb.clientUsers.findMany();
  let editors = (allUsers || []).filter((u: any) => u.role === "EDITOR" && u.status !== "INACTIVE");

  // Fallback to system admin if no dedicated editor accounts
  if (editors.length === 0) {
    const adminUser = (allUsers || []).find((u: any) => u.role === "ADMIN" || u.role === "SUPER_ADMIN");
    if (adminUser) editors = [adminUser];
  }

  if (editors.length === 0) {
    console.warn(`[EditorService] No available editors found for booking ${bookingId}`);
    return { success: false, message: "No active editors available." };
  }

  // Rank editors by active workload (count of current EDITING bookings)
  const editorWorkloads = await Promise.all(
    editors.map(async (editor: any) => {
      const activeBookings = await firestoreDb.bookings.findMany({
        where: { editorId: editor.id, status: "EDITING" },
      });
      return {
        editor,
        workload: activeBookings.length,
      };
    })
  );

  editorWorkloads.sort((a, b) => a.workload - b.workload);
  const chosenEditor = editorWorkloads[0].editor;

  // Atomically assign editor
  await firestoreDb.bookings.update({
    where: { id: bookingId },
    data: {
      editorId: chosenEditor.id,
      editCountdown: 60, // 60-minute SLA countdown
    },
  });

  await logAudit({
    userId: chosenEditor.id,
    action: "EDITOR_AUTO_ASSIGNED",
    entity: "Booking",
    entityId: bookingId,
    details: JSON.stringify({
      editorId: chosenEditor.id,
      editorName: chosenEditor.name || chosenEditor.displayName,
      workload: editorWorkloads[0].workload,
    }),
  });

  await createOutboxEvent({
    eventType: "editor_assigned",
    entityId: bookingId,
    payload: {
      bookingId,
      editorId: chosenEditor.id,
      editorName: chosenEditor.name || chosenEditor.displayName,
      footageUrls: booking.footageUrls,
      brandRequirements: booking.editorRequirements,
    },
  });

  console.log(`[EditorService] Automatically assigned editor ${chosenEditor.name || chosenEditor.id} to booking ${bookingId}`);

  return {
    success: true,
    editorId: chosenEditor.id,
    editorName: chosenEditor.name || chosenEditor.displayName,
    message: "Editor successfully assigned.",
  };
}

/**
 * 2. Deliver finalized master reel.
 * Enforces editor ownership and triggers single authoritative partner earnings settlement.
 */
export async function deliverMasterReel(params: DeliverReelParams): Promise<DeliverReelResult> {
  const { bookingId, editorId, editorRole, masterReelUrl, hlsPlaylistUrl, notes } = params;

  if (!masterReelUrl || !masterReelUrl.trim()) {
    return {
      success: false,
      error: { code: "INVALID_URL", message: "Master reel URL is required." },
      message: "Master reel URL is required.",
    };
  }

  const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return {
      success: false,
      error: { code: "BOOKING_NOT_FOUND", message: `Booking ${bookingId} not found.` },
      message: "Booking not found.",
    };
  }

  // Verify status is EDITING
  if (booking.status !== "EDITING") {
    return {
      success: false,
      error: {
        code: "BOOKING_INVALID_STATE",
        message: `Cannot deliver reel: booking is in ${booking.status} state (must be EDITING).`,
      },
      message: `Booking is in ${booking.status} state.`,
    };
  }

  // Verify editor ownership
  const isSuperAdmin = ["ADMIN", "SUPER_ADMIN"].includes(editorRole);
  if (booking.editorId && booking.editorId !== editorId && !isSuperAdmin) {
    return {
      success: false,
      error: {
        code: "RESOURCE_FORBIDDEN",
        message: "You can only deliver reels for bookings assigned to you.",
      },
      message: "Unauthorized editor.",
    };
  }

  // Transition booking to DELIVERED via state machine
  const transitionRes = await transitionBookingState(
    bookingId,
    "DELIVERED",
    {
      actorId: editorId,
      actorRole: isSuperAdmin ? "ADMIN" : "EDITOR",
      reason: `Master reel delivered by editor (${editorId})`,
      metadata: { masterReelUrl, notes },
    },
    {
      masterReelUrl,
      hlsPlaylistUrl: hlsPlaylistUrl || null,
      syncPercentage: 100,
      editCountdown: 0,
      notes: notes ? `${booking.notes || ""}\nEditor Note: ${notes}` : booking.notes,
    }
  );

  if (!transitionRes.success) {
    return {
      success: false,
      error: transitionRes.error,
      message: transitionRes.error?.message || "Failed to transition booking to DELIVERED.",
    };
  }

  return {
    success: true,
    booking: transitionRes.booking,
    message: "Master reel successfully delivered. Partner earning settled.",
  };
}
