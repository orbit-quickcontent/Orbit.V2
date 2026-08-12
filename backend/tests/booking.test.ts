import { describe, it, expect } from "vitest";

const validBookingStatuses = [
  "REQUESTED",
  "PARTNER_DISPATCHED",
  "ACCEPTED",
  "EN_ROUTE",
  "SHOOTING",
  "SYNCING",
  "READY_TO_EDIT",
  "EDITING",
  "DELIVERED",
  "CANCELLED",
];

function canTransitionStatus(currentStatus: string, newStatus: string, userRole: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;

  if (newStatus === "DELIVERED") {
    return userRole === "EDITOR";
  }

  if (newStatus === "ACCEPTED" || newStatus === "EN_ROUTE" || newStatus === "SHOOTING" || newStatus === "SYNCING") {
    return userRole === "PARTNER";
  }

  if (newStatus === "CANCELLED" || newStatus === "REQUESTED") {
    return userRole === "CLIENT";
  }

  return false;
}

describe("Booking State Transition & Authorization Rules", () => {
  it("should validate all legal booking statuses", () => {
    expect(validBookingStatuses).toContain("DELIVERED");
    expect(validBookingStatuses).toContain("EDITING");
    expect(validBookingStatuses).toContain("ACCEPTED");
  });

  it("should allow EDITOR to transition status to DELIVERED", () => {
    expect(canTransitionStatus("EDITING", "DELIVERED", "EDITOR")).toBe(true);
  });

  it("should reject CLIENT from setting status to DELIVERED", () => {
    expect(canTransitionStatus("EDITING", "DELIVERED", "CLIENT")).toBe(false);
  });

  it("should reject PARTNER from setting status to DELIVERED", () => {
    expect(canTransitionStatus("EDITING", "DELIVERED", "PARTNER")).toBe(false);
  });

  it("should allow SUPER_ADMIN or ADMIN to override any status transition", () => {
    expect(canTransitionStatus("REQUESTED", "DELIVERED", "SUPER_ADMIN")).toBe(true);
    expect(canTransitionStatus("REQUESTED", "DELIVERED", "ADMIN")).toBe(true);
  });
});
