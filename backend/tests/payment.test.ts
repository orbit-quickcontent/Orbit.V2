/**
 * Vitest — Payments, Package Economics & Cancellation Refund Tests
 */

import { describe, it, expect } from "vitest";
import {
  getPackageEconomics,
  createFinancialSnapshot,
  validateEconomics,
} from "../src/lib/package-economics";
import {
  verifyWebhookSignature,
  calculateClientRefund,
} from "../src/services/payment.service";

describe("Centralized Package Economics & Financial Snapshots", () => {
  it("Package 1 (Personalized: ₹1,999) must guarantee ₹700 partner payout", () => {
    const economics = getPackageEconomics("PERSONALIZED");
    expect(economics.grossAmount).toBe(1999);
    expect(economics.partnerEarningAmount).toBe(700);
    expect(economics.platformCommissionAmount).toBe(799);
  });

  it("Package 2 (Professional UGC: ₹4,999) must guarantee ₹700 partner payout", () => {
    const economics = getPackageEconomics("PROFESSIONAL");
    expect(economics.grossAmount).toBe(4999);
    expect(economics.partnerEarningAmount).toBe(700);
    expect(economics.platformCommissionAmount).toBe(3799);
  });

  it("should freeze immutable financial snapshot", () => {
    const snapshot = createFinancialSnapshot(1999);
    expect(snapshot.grossAmount).toBe(1999);
    expect(snapshot.partnerEarningAmount).toBe(700);
    expect(snapshot.currency).toBe("INR");
  });

  it("should reject illegal economics configurations where deductions > gross", () => {
    expect(() =>
      validateEconomics({
        grossAmount: 1000,
        partnerEarningAmount: 700,
        editorPayoutAmount: 500,
        taxAmount: 0,
      })
    ).toThrow("Invalid package economics");
  });
});

describe("Razorpay Webhook Verification & Refund Policies", () => {
  it("should verify HMAC-SHA256 signatures accurately", () => {
    const rawBody = JSON.stringify({ event: "payment.captured" });
    // Valid signature check returns boolean
    const result = verifyWebhookSignature(rawBody, "invalid_sig");
    expect(result).toBe(false);
  });

  it("should enforce 100% full refund before Partner acceptance", async () => {
    const preAcceptBooking = { grossAmount: 1999, status: "DISPATCHED" };
    const refund = await calculateClientRefund(preAcceptBooking);
    expect(refund.refundPercent).toBe(100);
    expect(refund.refundAmount).toBe(1999);
    expect(refund.policyApplied).toBe("FULL_REFUND_PRE_ACCEPTANCE");
  });

  it("should enforce partial refund after Partner acceptance but before shooting", async () => {
    const postAcceptBooking = { grossAmount: 1999, status: "EN_ROUTE" };
    const refund = await calculateClientRefund(postAcceptBooking);
    expect(refund.refundPercent).toBe(50);
    expect(refund.refundAmount).toBe(1000); // 50% of 1999 rounded
  });

  it("should enforce 0% refund after shooting begins", async () => {
    const shootingBooking = { grossAmount: 1999, status: "SHOOTING" };
    const refund = await calculateClientRefund(shootingBooking);
    expect(refund.refundPercent).toBe(0);
    expect(refund.refundAmount).toBe(0);
    expect(refund.policyApplied).toBe("NO_REFUND_AFTER_SHOOT_STARTED");
  });
});
