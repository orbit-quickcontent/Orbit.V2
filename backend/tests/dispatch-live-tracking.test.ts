import { describe, it, expect, beforeEach } from "vitest";
import { validateCoordinates, PartnerLocationSchema, RouteQuerySchema } from "../src/utils/validation";
import { RouteService } from "../src/services/route.service";
import { PartnerLocationService } from "../src/services/partner-location.service";
import { acceptPartnerOffer } from "../src/services/dispatch.service";
import { firestoreDb } from "../src/lib/db";

describe("ORBIT Free Dispatch & Live Tracking Test Suite", () => {
  describe("1. Coordinate & Schema Validation", () => {
    it("should accept valid geographical coordinates", () => {
      expect(validateCoordinates(19.076, 72.8777)).toBe(true);
      expect(validateCoordinates(-33.8688, 151.2093)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
    });

    it("should reject out-of-bounds coordinates", () => {
      expect(validateCoordinates(95.0, 72.8777)).toBe(false);
      expect(validateCoordinates(19.076, 185.0)).toBe(false);
      expect(validateCoordinates(NaN, 72.8777)).toBe(false);
    });

    it("should validate partner location payload schema", () => {
      const validPayload = {
        partnerId: "partner_test_1",
        lat: 19.076,
        lng: 72.8777,
        speed: 8.5,
        heading: 120,
        accuracy: 5,
        timestamp: Date.now(),
      };
      const result = PartnerLocationSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid partner location payload", () => {
      const invalidPayload = {
        partnerId: "partner_test_1",
        lat: 120.0, // Invalid latitude > 90
        lng: 72.8777,
      };
      const result = PartnerLocationSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("2. Route Calculation & Haversine Fallback", () => {
    it("should compute realistic driving distance and ETA via Haversine fallback", () => {
      const fromLat = 19.076;
      const fromLng = 72.8777;
      const toLat = 19.082;
      const toLng = 72.889;

      const fallbackRoute = RouteService.calculateHaversineFallback(fromLat, fromLng, toLat, toLng);
      expect(fallbackRoute.distanceMeters).toBeGreaterThan(1000);
      expect(fallbackRoute.durationSeconds).toBeGreaterThan(60);
      expect(fallbackRoute.estimatedMinutes).toBeGreaterThanOrEqual(1);
      expect(fallbackRoute.geometry.type).toBe("LineString");
      expect(fallbackRoute.geometry.coordinates.length).toBe(2);
      expect(fallbackRoute.fallback).toBe(true);
    });

    it("should calculate route using RouteService.getRoute", async () => {
      const route = await RouteService.getRoute(19.076, 72.8777, 19.082, 72.889);
      expect(route).toBeDefined();
      expect(route.distanceMeters).toBeGreaterThan(0);
      expect(route.estimatedMinutes).toBeGreaterThan(0);
    });
  });

  describe("3. Partner Location Management & Rate Limiting", () => {
    it("should enforce rate limit for location updates", async () => {
      const partnerId = `prt_rate_test_${Date.now()}`;
      const firstCheck = await PartnerLocationService.checkRateLimit(partnerId);
      expect(firstCheck).toBe(true);
    });

    it("should accept valid partner location updates", async () => {
      const partnerId = `prt_loc_test_${Date.now()}`;
      const res = await PartnerLocationService.updateLocation({
        partnerId,
        lat: 19.076,
        lng: 72.8777,
        speed: 12.0,
        heading: 90.0,
        status: "ONLINE",
        availability: "AVAILABLE",
      });
      expect(res.success).toBe(true);
    });
  });

  describe("4. Atomic Booking Acceptance & Lock Invariants", () => {
    const bookingId = `booking_dispatch_test_${Date.now()}`;
    const partnerId = `partner_dispatch_test_${Date.now()}`;

    beforeEach(async () => {
      await firestoreDb.bookings.create({
        data: {
          id: bookingId,
          userId: "client_test_1",
          packageId: "pkg_pro_1",
          status: "DISPATCHED",
          grossAmount: 1999,
          partnerEarningAmount: 700,
          editorPayoutAmount: 500,
          platformCommissionAmount: 799,
          bookingDate: new Date().toISOString(),
          timeSlot: "10:00 AM - 11:00 AM",
        },
      });
    });

    it("should accept booking offer and assign partner atomically", async () => {
      const acceptRes = await acceptPartnerOffer(bookingId, partnerId, "Alex Creator");
      expect(acceptRes.success).toBe(true);
      expect(acceptRes.booking?.status).toBe("EN_ROUTE");
      expect(acceptRes.booking?.partnerId).toBe(partnerId);
    });

    it("should prevent duplicate acceptance by a second partner", async () => {
      const firstRes = await acceptPartnerOffer(bookingId, partnerId, "Alex Creator");
      expect(firstRes.success).toBe(true);

      const secondPartnerId = `partner_second_${Date.now()}`;
      const duplicateRes = await acceptPartnerOffer(bookingId, secondPartnerId, "Bob Creator");
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.message).toMatch(/accepted|state/i);
    });
  });
});
