/**
 * ORBIT QuickContent — Production Uber/Ola-Style Nearby Partner Dispatch Engine
 *
 * 1. Redis GEO candidate search & multi-round waterfall (0-2km, 2-5km, 5-10km).
 * 2. 20-second offer timeout queue per candidate.
 * 3. Guaranteed ₹700 partner payout contract.
 * 4. Atomic Redis locks (dispatch:partner:{id} & dispatch:booking:{id}) with NX EX 900.
 * 5. Automatic waterfall on rejection/timeout.
 */

import { firestoreDb } from "../lib/db";
import { PartnerLocationService } from "./partner-location.service";
import { connectRedis } from "../utils/redis";
import { notifyDispatch, notifyAccept, notifyStatusChange, notifyClient } from "./websocket.service";
import { transitionBookingState } from "./booking-state-machine";
import { logAudit } from "./audit.service";
import { RouteService } from "./route.service";
import { ENV } from "../config/env";

const activeTimers = new Map<string, NodeJS.Timeout>();

export interface DispatchCandidate {
  partnerId: string;
  distanceKm: number;
  lat: number;
  lng: number;
  availability: string;
  rating?: number;
}

export interface DispatchOfferPayload {
  bookingId: string;
  dispatchId: string;
  round: number;
  partnerEarningAmount: number; // Guaranteed ₹700
  earningAmount: number;        // ₹700 (compatibility alias)
  currency: string;
  expiresAt: string;
  timeoutSeconds: number;
  distanceKm: number;
  etaMinutes: number;
  booking: any;
}

/**
 * Trigger nearby partner dispatch for a PAID booking.
 */
export async function triggerNearbyPartnerDispatch(bookingId: string): Promise<void> {
  const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  // Only dispatch if status is PAID or DISPATCHED and no partner is assigned yet
  if (booking.partnerId || !["PAID", "DISPATCHED"].includes(booking.status)) {
    return;
  }

  // 1. Transition booking to DISPATCHED
  if (booking.status === "PAID") {
    await transitionBookingState(bookingId, "DISPATCHED", {
      actorId: "SYSTEM",
      actorRole: "SYSTEM",
      reason: "Automated nearby partner dispatch search started",
    });
  }

  const currentRound = (booking.dispatchRound || 0) + 1;

  // 2. Multi-round radius: Round 1 (2km), Round 2 (5km), Round 3+ (10km)
  let searchRadiusKm = ENV.NEARBY_RADIUS_KM;
  if (currentRound === 1) searchRadiusKm = 2;
  else if (currentRound === 2) searchRadiusKm = 5;
  else searchRadiusKm = 10;

  // 3. Resolve shoot coordinates
  const shootLat = booking.latitude ?? 28.6139;
  const shootLng = booking.longitude ?? 77.209;

  // 4. Query Redis GEO for nearby available partners
  const candidates = await PartnerLocationService.searchNearby(
    shootLat,
    shootLng,
    searchRadiusKm,
    ENV.MAX_NEARBY_PARTNERS
  );

  // Parse declined partners list
  let declinedBy: string[] = [];
  try {
    declinedBy = booking.declinedBy
      ? typeof booking.declinedBy === "string"
        ? JSON.parse(booking.declinedBy)
        : booking.declinedBy
      : [];
  } catch {
    declinedBy = [];
  }

  // Filter out declined partners and check Redis partner locks
  const redis = await connectRedis();
  const eligibleCandidates: DispatchCandidate[] = [];

  for (const cand of candidates) {
    if (declinedBy.includes(cand.partnerId)) continue;
    if (redis) {
      const isLocked = await redis.get(`dispatch:partner:${cand.partnerId}`);
      if (isLocked) continue; // Partner already reserved for another booking
    }
    eligibleCandidates.push(cand);
  }

  if (eligibleCandidates.length === 0) {
    console.warn(`[Dispatch] No eligible partners available for booking ${bookingId} in round ${currentRound} (${searchRadiusKm}km)`);
    if (currentRound < 4) {
      // Expand radius immediately in next round
      await firestoreDb.bookings.update({
        where: { id: bookingId },
        data: { dispatchRound: currentRound },
      });
      setTimeout(() => triggerNearbyPartnerDispatch(bookingId), 3000);
    } else {
      notifyClient({
        bookingId,
        event: "dispatch_failed",
        data: { bookingId, reason: "No nearby partners available in area" },
      });
    }
    return;
  }

  // 5. Select batch of candidates (up to DISPATCH_BATCH_SIZE)
  const batchCandidates = eligibleCandidates.slice(0, ENV.DISPATCH_BATCH_SIZE);
  const targetPartner = batchCandidates[0];
  const distanceKm = targetPartner.distanceKm;

  // Calculate ETA
  let etaMinutes = Math.max(5, Math.round(distanceKm * 3));
  try {
    const route = await RouteService.getRoute(targetPartner.lat, targetPartner.lng, shootLat, shootLng);
    etaMinutes = route.estimatedMinutes;
  } catch {}

  // 6. Create dispatch offer in Redis with 20s TTL
  const expiresAtMs = Date.now() + ENV.DISPATCH_OFFER_SECONDS * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();

  if (redis) {
    const offerPipeline = redis.pipeline();
    batchCandidates.forEach((c) => {
      offerPipeline.set(
        `dispatch:offer:${bookingId}:${c.partnerId}`,
        JSON.stringify({ bookingId, partnerId: c.partnerId, expiresAt: expiresAtMs }),
        "EX",
        ENV.DISPATCH_OFFER_SECONDS
      );
    });
    await offerPipeline.exec();
  }

  await firestoreDb.workDispatches.create({
    data: {
      bookingId,
      partnerId: targetPartner.partnerId,
      status: "PENDING",
      round: currentRound,
      distanceKm,
      dispatchedAt: new Date().toISOString(),
      expiresAt,
    },
  });

  await firestoreDb.bookings.update({
    where: { id: bookingId },
    data: { dispatchRound: currentRound },
  });

  // 7. Build Offer Payload with guaranteed ₹700 earnings
  const offerPayload: DispatchOfferPayload = {
    bookingId,
    dispatchId: `${bookingId}-rnd-${currentRound}`,
    round: currentRound,
    partnerEarningAmount: booking.partnerEarningAmount || 700,
    earningAmount: booking.partnerEarningAmount || 700,
    currency: "INR",
    expiresAt,
    timeoutSeconds: ENV.DISPATCH_OFFER_SECONDS,
    distanceKm,
    etaMinutes,
    booking: {
      ...booking,
      partnerEarningAmount: booking.partnerEarningAmount || 700,
      earningAmount: booking.partnerEarningAmount || 700,
    },
  };

  // 8. Emit offer via WebSocket to candidate partners
  notifyDispatch({
    bookingId,
    partnerIds: batchCandidates.map((c) => c.partnerId),
    booking: offerPayload,
    round: currentRound,
  });

  // 9. Schedule 20-second offer timeout
  if (activeTimers.has(bookingId)) {
    clearTimeout(activeTimers.get(bookingId)!);
  }

  const timer = setTimeout(async () => {
    await handleDispatchTimeout(bookingId, batchCandidates.map((c) => c.partnerId), currentRound);
  }, ENV.DISPATCH_OFFER_SECONDS * 1000);

  activeTimers.set(bookingId, timer);
}

/**
 * Handle 20-second offer expiration -> waterfall to next candidate.
 */
export async function handleDispatchTimeout(bookingId: string, partnerIds: string[], round: number): Promise<void> {
  const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!booking || booking.partnerId || booking.status !== "DISPATCHED") {
    return;
  }

  // Append partners to declined list
  let declinedBy: string[] = [];
  try {
    declinedBy = booking.declinedBy
      ? typeof booking.declinedBy === "string"
        ? JSON.parse(booking.declinedBy)
        : booking.declinedBy
      : [];
  } catch {
    declinedBy = [];
  }

  partnerIds.forEach((id) => {
    if (!declinedBy.includes(id)) declinedBy.push(id);
  });

  await firestoreDb.bookings.update({
    where: { id: bookingId },
    data: { declinedBy: JSON.stringify(declinedBy) },
  });

  // Waterfall to next candidate if under max rounds
  if (round < 4) {
    console.log(`[Dispatch] Booking ${bookingId} round ${round} timed out. Waterfalling to next candidates...`);
    await triggerNearbyPartnerDispatch(bookingId);
  } else {
    console.warn(`[Dispatch] Booking ${bookingId} reached max dispatch rounds with no acceptance.`);
    notifyClient({
      bookingId,
      event: "dispatch_failed",
      data: { bookingId, reason: "Dispatch timed out with no partner acceptance" },
    });
  }
}

/**
 * Partner accepts offer with atomic double-lock (dispatch:booking & dispatch:partner).
 */
export async function acceptPartnerOffer(
  bookingId: string,
  partnerId: string,
  partnerName = "Assigned Partner"
): Promise<{ success: boolean; message: string; booking?: any }> {
  const redis = await connectRedis();

  // 1. Atomic Redis Booking Lock: only one partner wins
  if (redis) {
    try {
      const bookingLock = await redis.set(`dispatch:booking:${bookingId}`, partnerId, "EX", 900, "NX");
      if (bookingLock !== "OK") {
        return {
          success: false,
          message: "Another partner has already accepted this booking.",
        };
      }

      // Atomic Redis Partner Lock: partner cannot take 2 simultaneous bookings
      const partnerLock = await redis.set(`dispatch:partner:${partnerId}`, bookingId, "EX", 900, "NX");
      if (partnerLock !== "OK") {
        await redis.del(`dispatch:booking:${bookingId}`).catch(() => {});
        return {
          success: false,
          message: "You are currently assigned to another active booking.",
        };
      }
    } catch {}
  }

  try {
    const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return { success: false, message: "Booking not found." };
    }

    if (booking.partnerId) {
      return {
        success: false,
        message: "This booking has already been accepted by another partner.",
      };
    }

    // Clear active timeout
    if (activeTimers.has(bookingId)) {
      clearTimeout(activeTimers.get(bookingId)!);
      activeTimers.delete(bookingId);
    }

    // 2. Atomically transition state to EN_ROUTE
    const transitionRes = await transitionBookingState(
      bookingId,
      "EN_ROUTE",
      {
        actorId: partnerId,
        actorRole: "PARTNER",
        reason: `Partner ${partnerName} (${partnerId}) accepted booking offer`,
        metadata: { partnerName },
      },
      {
        partnerId,
      }
    );

    if (!transitionRes.success) {
      if (redis) {
        await redis.del(`dispatch:booking:${bookingId}`);
        await redis.del(`dispatch:partner:${partnerId}`);
      }
      return {
        success: false,
        message: transitionRes.error?.message || "Failed to accept booking offer.",
      };
    }

    // 3. Update PartnerEarning record with PENDING status (Guaranteed ₹700)
    await firestoreDb.partnerEarnings.upsert({
      where: { bookingId },
      create: {
        bookingId,
        partnerId,
        grossAmount: booking.grossAmount || 1999,
        partnerEarningAmount: booking.partnerEarningAmount || 700,
        editorPayoutAmount: booking.editorPayoutAmount || 500,
        taxAmount: booking.taxAmount || 0,
        platformCommissionAmount: booking.platformCommissionAmount || 799,
        status: "PENDING",
      },
      update: {
        partnerId,
        status: "PENDING",
      },
    });

    // 4. Clean up all dispatch offers for this booking
    if (redis) {
      const offerKeys = await redis.keys(`dispatch:offer:${bookingId}:*`);
      if (offerKeys.length > 0) {
        await redis.del(...offerKeys);
      }
    }

    // 5. Notify client and partner via Socket.IO
    notifyAccept({
      bookingId,
      partnerId,
      partnerName,
      booking: transitionRes.booking,
    });

    notifyStatusChange({
      bookingId,
      status: "EN_ROUTE",
      previousStatus: "DISPATCHED",
      booking: transitionRes.booking,
    });

    await logAudit({
      userId: partnerId,
      action: "PARTNER_OFFER_ACCEPTED",
      entity: "Booking",
      entityId: bookingId,
      details: JSON.stringify({
        partnerId,
        partnerName,
        partnerEarningAmount: 700,
      }),
    });

    return {
      success: true,
      message: "Booking offer successfully accepted.",
      booking: transitionRes.booking,
    };
  } catch (err: any) {
    if (redis) {
      await redis.del(`dispatch:booking:${bookingId}`);
      await redis.del(`dispatch:partner:${partnerId}`);
    }
    return { success: false, message: err.message || "Internal error during acceptance" };
  }
}

/**
 * Partner declines offer -> waterfall immediately.
 */
export async function declinePartnerOffer(
  bookingId: string,
  partnerId: string
): Promise<{ success: boolean; message: string }> {
  const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) return { success: false, message: "Booking not found." };

  let declinedBy: string[] = [];
  try {
    declinedBy = booking.declinedBy
      ? typeof booking.declinedBy === "string"
        ? JSON.parse(booking.declinedBy)
        : booking.declinedBy
      : [];
  } catch {
    declinedBy = [];
  }

  if (!declinedBy.includes(partnerId)) {
    declinedBy.push(partnerId);
  }

  await firestoreDb.bookings.update({
    where: { id: bookingId },
    data: { declinedBy: JSON.stringify(declinedBy) },
  });

  const redis = await connectRedis();
  if (redis) {
    await redis.del(`dispatch:offer:${bookingId}:${partnerId}`);
  }

  // Clear timeout and waterfall immediately
  if (activeTimers.has(bookingId)) {
    clearTimeout(activeTimers.get(bookingId)!);
    activeTimers.delete(bookingId);
  }

  triggerNearbyPartnerDispatch(bookingId).catch((err) =>
    console.error(`[Dispatch] Error waterfalling after decline for ${bookingId}:`, err)
  );

  return { success: true, message: "Offer declined successfully." };
}

/**
 * Partner arrived at client shoot location -> status becomes SHOOTING.
 */
export async function partnerArrivedAtLocation(bookingId: string, partnerId: string): Promise<{ success: boolean; message: string }> {
  const transitionRes = await transitionBookingState(bookingId, "SHOOTING", {
    actorId: partnerId,
    actorRole: "PARTNER",
    reason: "Partner arrived at location and initiated shooting",
  });

  if (!transitionRes.success) {
    return { success: false, message: transitionRes.error?.message || "Failed to mark arrival." };
  }

  notifyStatusChange({
    bookingId,
    status: "SHOOTING",
    previousStatus: "EN_ROUTE",
    booking: transitionRes.booking,
  });

  return { success: true, message: "Partner arrival confirmed. Shoot started." };
}

/**
 * Release partner lock upon booking completion / cancellation.
 */
export async function releasePartnerLock(bookingId: string, partnerId?: string): Promise<void> {
  const redis = await connectRedis();
  if (!redis) return;

  const pipeline = redis.pipeline();
  pipeline.del(`dispatch:booking:${bookingId}`);
  if (partnerId) {
    pipeline.del(`dispatch:partner:${partnerId}`);
  }
  await pipeline.exec();
}
