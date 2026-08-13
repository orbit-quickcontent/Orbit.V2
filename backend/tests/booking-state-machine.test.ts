/**
 * Vitest — Booking State Machine & Canonical Transition Tests
 */

import { describe, it, expect } from "vitest";
import {
  isLegalTransition,
  CanonicalBookingStatus,
  ActorRole,
} from "../src/services/booking-state-machine";

describe("Canonical Booking State Machine", () => {
  it("should permit legal forward transitions for appropriate roles", () => {
    // 1. PENDING -> PAID (CLIENT / SYSTEM / ADMIN)
    expect(isLegalTransition("PENDING", "PAID", "CLIENT")).toBe(true);
    expect(isLegalTransition("PENDING", "PAID", "SYSTEM")).toBe(true);

    // 2. PAID -> DISPATCHED (SYSTEM / ADMIN)
    expect(isLegalTransition("PAID", "DISPATCHED", "SYSTEM")).toBe(true);

    // 3. DISPATCHED -> EN_ROUTE (PARTNER / ADMIN)
    expect(isLegalTransition("DISPATCHED", "EN_ROUTE", "PARTNER")).toBe(true);

    // 4. EN_ROUTE -> SHOOTING (PARTNER / ADMIN)
    expect(isLegalTransition("EN_ROUTE", "SHOOTING", "PARTNER")).toBe(true);

    // 5. SHOOTING -> SYNCING (PARTNER / ADMIN)
    expect(isLegalTransition("SHOOTING", "SYNCING", "PARTNER")).toBe(true);

    // 6. SYNCING -> EDITING (PARTNER / SYSTEM / ADMIN)
    expect(isLegalTransition("SYNCING", "EDITING", "PARTNER")).toBe(true);
    expect(isLegalTransition("SYNCING", "EDITING", "SYSTEM")).toBe(true);

    // 7. EDITING -> DELIVERED (EDITOR / ADMIN)
    expect(isLegalTransition("EDITING", "DELIVERED", "EDITOR")).toBe(true);
  });

  it("CRITICAL: Payment NEVER directly moves booking to EN_ROUTE", () => {
    expect(isLegalTransition("PENDING", "EN_ROUTE", "CLIENT")).toBe(false);
    expect(isLegalTransition("PAID", "EN_ROUTE", "CLIENT")).toBe(false);
    expect(isLegalTransition("PAID", "EN_ROUTE", "SYSTEM")).toBe(false);
  });

  it("should strictly reject backwards and illegal skipped transitions", () => {
    expect(isLegalTransition("EDITING", "SHOOTING", "PARTNER")).toBe(false);
    expect(isLegalTransition("DELIVERED", "EDITING", "EDITOR")).toBe(false);
    expect(isLegalTransition("DELIVERED", "PENDING", "CLIENT")).toBe(false);
    expect(isLegalTransition("CANCELLED", "PAID", "CLIENT")).toBe(false);
    expect(isLegalTransition("PENDING", "DELIVERED", "CLIENT")).toBe(false);
  });

  it("should enforce role-based authorization for transitions", () => {
    // Only EDITOR can deliver
    expect(isLegalTransition("EDITING", "DELIVERED", "CLIENT")).toBe(false);
    expect(isLegalTransition("EDITING", "DELIVERED", "PARTNER")).toBe(false);

    // Only PARTNER can accept offer to EN_ROUTE
    expect(isLegalTransition("DISPATCHED", "EN_ROUTE", "CLIENT")).toBe(false);
    expect(isLegalTransition("DISPATCHED", "EN_ROUTE", "EDITOR")).toBe(false);
  });

  it("should allow cancellation from all non-terminal states", () => {
    expect(isLegalTransition("PENDING", "CANCELLED", "CLIENT")).toBe(true);
    expect(isLegalTransition("PAID", "CANCELLED", "CLIENT")).toBe(true);
    expect(isLegalTransition("DISPATCHED", "CANCELLED", "CLIENT")).toBe(true);
    expect(isLegalTransition("EN_ROUTE", "CANCELLED", "CLIENT")).toBe(true);
    expect(isLegalTransition("SHOOTING", "CANCELLED", "CLIENT")).toBe(true);
    expect(isLegalTransition("SYNCING", "CANCELLED", "CLIENT")).toBe(true);

    // Terminal state DELIVERED or CANCELLED cannot be cancelled again
    expect(isLegalTransition("DELIVERED", "CANCELLED", "CLIENT")).toBe(false);
    expect(isLegalTransition("CANCELLED", "CANCELLED", "CLIENT")).toBe(false);
  });

  it("should allow SUPER_ADMIN to override transitions", () => {
    expect(isLegalTransition("PENDING", "DELIVERED", "SUPER_ADMIN")).toBe(true);
    expect(isLegalTransition("EDITING", "SHOOTING", "SUPER_ADMIN")).toBe(true);
  });
});
