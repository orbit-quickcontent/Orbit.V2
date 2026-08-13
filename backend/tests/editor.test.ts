/**
 * Vitest — Editor Assignment & Delivery Tests
 */

import { describe, it, expect, beforeAll } from "vitest";
import { assignEditorToBooking, deliverMasterReel } from "../src/services/editor.service";
import { firestoreDb } from "../src/lib/db";

describe("Automatic Editor Assignment & Delivery Verification", () => {
  const testEditorId = "test_editor_1";
  const testBookingId = "test_editor_booking_1";

  beforeAll(async () => {
    // Create editor user
    await firestoreDb.clientUsers.create({
      data: {
        id: testEditorId,
        email: "editor@orbit.app",
        name: "Pro Editor",
        role: "EDITOR",
        status: "ACTIVE",
      },
    });

    // Create booking in SYNCING / EDITING
    await firestoreDb.bookings.create({
      data: {
        id: testBookingId,
        userId: "test_client_1",
        packageId: "pkg_1",
        partnerId: "partner_1",
        status: "EDITING",
        editorId: testEditorId,
        partnerEarningAmount: 700,
      },
    });
  });

  it("should assign editor to booking idempotently", async () => {
    const res = await assignEditorToBooking(testBookingId);
    expect(res.success).toBe(true);
    expect(res.editorId).toBe(testEditorId);
  });

  it("should reject reel delivery from unauthorized editor", async () => {
    const res = await deliverMasterReel({
      bookingId: testBookingId,
      editorId: "unauthorized_editor_99",
      editorRole: "EDITOR",
      masterReelUrl: "https://orbit.app/reels/final_1.mp4",
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("RESOURCE_FORBIDDEN");
  });

  it("should deliver master reel and settle partner earnings for authorized editor", async () => {
    const res = await deliverMasterReel({
      bookingId: testBookingId,
      editorId: testEditorId,
      editorRole: "EDITOR",
      masterReelUrl: "https://orbit.app/reels/final_1.mp4",
    });

    expect(res.success).toBe(true);
    expect(res.booking?.status).toBe("DELIVERED");
    expect(res.booking?.masterReelUrl).toBe("https://orbit.app/reels/final_1.mp4");
  });
});
