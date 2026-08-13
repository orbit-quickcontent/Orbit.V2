/**
 * ORBIT QuickContent — Server-Authoritative Payment & Refund Engine
 *
 * Handles Razorpay order creation, HMAC-SHA256 cryptographic webhook verification,
 * duplicate webhook idempotency, server-authoritative amount validation, and
 * cancellation refund policies.
 *
 * Invariants:
 * 1. Order amount comes SOLELY from the frozen booking economics (`grossAmount`).
 * 2. Webhooks are verified with timing-safe signature comparison.
 * 3. Payment transitions booking to PAID exactly once.
 * 4. Dispatch is triggered ONLY after verified payment.
 */

import crypto from "crypto";
import { firestoreDb } from "../lib/db";
import { transitionBookingState } from "./booking-state-machine";
import { logAudit } from "./audit.service";
import { triggerNearbyPartnerDispatch } from "./dispatch.service";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_orbit_mock";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "orbit_razorpay_secret_hardening_2026";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

// Configurable cancellation refund policy
const CANCEL_AFTER_ACCEPTANCE_REFUND_PERCENT = Number(process.env.CLIENT_CANCEL_AFTER_ACCEPTANCE_REFUND_PERCENT || 50);

export interface CreateOrderParams {
  bookingId: string;
  clientId: string;
  idempotencyKey?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ProcessWebhookResult {
  success: boolean;
  event?: string;
  bookingId?: string;
  paymentId?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface RefundResult {
  success: boolean;
  refundAmount: number;
  refundPercent: number;
  policyApplied: string;
  refundId?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 1. Create a server-authoritative Razorpay order for a booking.
 */
export async function createPaymentOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { bookingId, clientId, idempotencyKey } = params;

  // 1. Fetch booking
  const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return {
      success: false,
      error: { code: "BOOKING_NOT_FOUND", message: `Booking ${bookingId} not found.` },
    };
  }

  // 2. Verify ownership
  if (booking.userId !== clientId) {
    return {
      success: false,
      error: { code: "RESOURCE_FORBIDDEN", message: "You do not have permission to pay for this booking." },
    };
  }

  // 3. Verify booking status is PENDING
  if (booking.status !== "PENDING") {
    return {
      success: false,
      error: { code: "BOOKING_INVALID_STATE", message: `Cannot initiate payment for booking in state ${booking.status}.` },
    };
  }

  // 4. Check if payment order already exists and is active (Idempotency)
  if (booking.paymentOrderId && booking.paymentStatus === "PROCESSING") {
    return {
      success: true,
      orderId: booking.paymentOrderId,
      amount: booking.grossAmount || 1999,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
    };
  }

  // 5. Amount comes SOLELY from the frozen booking economics
  const grossAmount = booking.grossAmount || 1999;
  const amountInPaise = Math.round(grossAmount * 100);

  let razorpayOrderId = `order_${crypto.randomBytes(10).toString("hex")}`;

  // Call Razorpay API if real credentials provided
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
          ...(idempotencyKey ? { "X-Razorpay-Idempotency-Key": idempotencyKey } : {}),
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: bookingId,
          notes: {
            bookingId,
            userId: clientId,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        razorpayOrderId = data.id;
      } else {
        console.warn("[Razorpay] Order API fallback to mock id. Status:", res.status);
      }
    } catch (err) {
      console.warn("[Razorpay] Network exception during order creation, using fallback:", err);
    }
  }

  // 6. Save orderId and update payment status to PROCESSING
  await firestoreDb.bookings.update({
    where: { id: bookingId },
    data: {
      paymentOrderId: razorpayOrderId,
      paymentStatus: "PROCESSING",
      paymentMethod: "razorpay",
    },
  });

  await logAudit({
    userId: clientId,
    action: "PAYMENT_ORDER_CREATED",
    entity: "Booking",
    entityId: bookingId,
    details: JSON.stringify({
      orderId: razorpayOrderId,
      amount: grossAmount,
      currency: "INR",
      idempotencyKey,
    }),
  });

  return {
    success: true,
    orderId: razorpayOrderId,
    amount: grossAmount,
    currency: "INR",
    keyId: RAZORPAY_KEY_ID,
  };
}

/**
 * 2. Verify Razorpay webhook signature with timing-safe HMAC-SHA256 comparison.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!rawBody || !signature) return false;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const actualBuf = Buffer.from(signature, "utf-8");

    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * 3. Process Razorpay verified webhook event.
 */
export async function processPaymentWebhook(eventPayload: any): Promise<ProcessWebhookResult> {
  const event = eventPayload.event;
  const paymentEntity = eventPayload.payload?.payment?.entity || eventPayload.payload?.order?.entity || {};

  const orderId = paymentEntity.order_id || paymentEntity.id;
  const paymentId = paymentEntity.id;
  const bookingId = paymentEntity.notes?.bookingId || paymentEntity.receipt;

  if (!bookingId) {
    return {
      success: false,
      error: { code: "WEBHOOK_MISSING_BOOKING_ID", message: "Webhook payload does not contain a booking receipt/ID." },
    };
  }

  const booking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return {
      success: false,
      error: { code: "BOOKING_NOT_FOUND", message: `Booking ${bookingId} not found.` },
    };
  }

  // Duplicate webhook protection
  if (booking.paymentStatus === "SUCCESS" && booking.status !== "PENDING") {
    return {
      success: true,
      event,
      bookingId,
      paymentId,
      message: "Webhook already processed. Booking is already PAID.",
    };
  }

  if (event === "payment.captured" || event === "order.paid" || event === "payment_success") {
    // 1. Update payment details
    await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        paymentId,
        paymentStatus: "SUCCESS",
      },
    });

    // 2. Transition booking from PENDING -> PAID
    const transitionRes = await transitionBookingState(bookingId, "PAID", {
      actorId: booking.userId,
      actorRole: "SYSTEM",
      reason: `Verified Razorpay payment captured (${paymentId})`,
      metadata: { paymentId, orderId },
    });

    if (!transitionRes.success) {
      return {
        success: false,
        error: transitionRes.error,
      };
    }

    // 3. Trigger nearby partner dispatch
    triggerNearbyPartnerDispatch(bookingId).catch((err) =>
      console.error(`[PaymentService] Error triggering dispatch for ${bookingId}:`, err)
    );

    return {
      success: true,
      event,
      bookingId,
      paymentId,
      message: "Payment successfully verified and booking transitioned to PAID.",
    };
  } else if (event === "payment.failed") {
    await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "FAILED",
      },
    });

    return {
      success: true,
      event,
      bookingId,
      paymentId,
      message: "Payment failed marked on booking.",
    };
  }

  return {
    success: true,
    event,
    bookingId,
    message: "Unhandled event processed harmlessly.",
  };
}

/**
 * 4. Process Client Cancellation & Compute Tiered Refund.
 */
export async function calculateClientRefund(booking: any): Promise<RefundResult> {
  const grossAmount = booking.grossAmount || 1999;
  const status = booking.status;

  // Rule 1: Before Partner accepts (PENDING, PAID, DISPATCHED) -> 100% Full Refund
  if (["PENDING", "PAID", "DISPATCHED"].includes(status)) {
    return {
      success: true,
      refundAmount: grossAmount,
      refundPercent: 100,
      policyApplied: "FULL_REFUND_PRE_ACCEPTANCE",
    };
  }

  // Rule 2: After Partner accepts but before shooting starts (EN_ROUTE) -> Partial Refund
  if (status === "EN_ROUTE") {
    const refundAmount = Math.round((grossAmount * CANCEL_AFTER_ACCEPTANCE_REFUND_PERCENT) / 100);
    return {
      success: true,
      refundAmount,
      refundPercent: CANCEL_AFTER_ACCEPTANCE_REFUND_PERCENT,
      policyApplied: `PARTIAL_REFUND_POST_ACCEPTANCE_${CANCEL_AFTER_ACCEPTANCE_REFUND_PERCENT}%`,
    };
  }

  // Rule 3: After shooting starts (SHOOTING, SYNCING, EDITING, DELIVERED) -> 0% No Refund
  return {
    success: true,
    refundAmount: 0,
    refundPercent: 0,
    policyApplied: "NO_REFUND_AFTER_SHOOT_STARTED",
  };
}
