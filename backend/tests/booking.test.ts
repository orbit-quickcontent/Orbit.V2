/**
 * Vitest — Canonical Booking Lifecycle State Machine Test
 */

import { describe, it, expect } from "vitest";
import {
  isLegalTransition,
  CanonicalBookingStatus,
} from "../src/services/booking-state-machine";

const canonicalBookingStatuses: CanonicalBookingStatus[] = [
  "PENDING",
  "PAID",
  "DISPATCHED",
  "EN_ROUTE",
  "SHOOTING",
  "SYNCING",
  "EDITING",
  "DELIVERED",
  "CANCELLED",
];

describe("Canonical Booking Lifecycle Authorization Rules", () => {
  it("should contain all 9 canonical booking statuses", () => {
    expect(canonicalBookingStatuses).toHaveLength(9);
    expect(canonicalBookingStatuses).toContain("PENDING");
    expect(canonicalBookingStatuses).toContain("PAID");
    expect(canonicalBookingStatuses).toContain("DISPATCHED");
    expect(canonicalBookingStatuses).toContain("EN_ROUTE");
    expect(canonicalBookingStatuses).toContain("SHOOTING");
    expect(canonicalBookingStatuses).toContain("SYNCING");
    expect(canonicalBookingStatuses).toContain("EDITING");
    expect(canonicalBookingStatuses).toContain("DELIVERED");
    expect(canonicalBookingStatuses).toContain("CANCELLED");
  });

  it("should allow EDITOR to transition status to DELIVERED", () => {
    expect(isLegalTransition("EDITING", "DELIVERED", "EDITOR")).toBe(true);
  });

  it("should reject CLIENT from setting status to DELIVERED", () => {
    expect(isLegalTransition("EDITING", "DELIVERED", "CLIENT")).toBe(false);
  });

  it("should reject PARTNER from setting status to DELIVERED", () => {
    expect(isLegalTransition("EDITING", "DELIVERED", "PARTNER")).toBe(false);
  });

  it("should allow SUPER_ADMIN to override any status transition", () => {
    expect(isLegalTransition("PENDING", "DELIVERED", "SUPER_ADMIN")).toBe(true);
    expect(isLegalTransition("EDITING", "PAID", "SUPER_ADMIN")).toBe(true);
  });
});
