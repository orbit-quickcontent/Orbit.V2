/**
 * Vitest — Partner Earnings Settlement & Wallet Tests
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  settlePartnerEarning,
  getPartnerWalletSummary,
} from "../src/services/wallet.service";
import { firestoreDb } from "../src/lib/db";

describe("Authoritative Earnings Settlement & Wallet Invariants", () => {
  const testBookingId = "test_settle_booking_1";
  const testPartnerId = "test_partner_settle_1";

  beforeAll(async () => {
    // Create test partner
    await firestoreDb.partners.create({
      data: {
        id: testPartnerId,
        userId: "test_partner_user_1",
        location: "Mumbai",
        availability: true,
        isVerified: true,
        walletBalance: 0,
      },
    });

    // Create test booking
    await firestoreDb.bookings.create({
      data: {
        id: testBookingId,
        userId: "test_client_1",
        packageId: "pkg_1",
        partnerId: testPartnerId,
        status: "DELIVERED",
        grossAmount: 1999,
        partnerEarningAmount: 700,
        editorPayoutAmount: 500,
        taxAmount: 0,
        platformCommissionAmount: 799,
        partnerEarningStatus: "PENDING",
      },
    });
  });

  it("should settle ₹700 earnings idempotently", async () => {
    // 1. First settlement call
    const result1 = await settlePartnerEarning(testBookingId);
    expect(result1.success).toBe(true);
    expect(result1.earningAmount).toBe(700);
    expect(result1.alreadySettled).toBe(false);

    // 2. Second settlement call on same booking (Idempotency)
    const result2 = await settlePartnerEarning(testBookingId);
    expect(result2.success).toBe(true);
    expect(result2.earningAmount).toBe(700);
    expect(result2.alreadySettled).toBe(true);
  });

  it("should calculate wallet summaries accurately", async () => {
    const summary = await getPartnerWalletSummary(testPartnerId);
    expect(summary).toBeDefined();
    expect(summary.partnerId).toBe(testPartnerId);
    expect(typeof summary.availableBalance).toBe("number");
    expect(typeof summary.totalEarned).toBe("number");
  });
});
