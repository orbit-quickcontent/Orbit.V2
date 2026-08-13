import { describe, expect, it } from "vitest";

const bookingStates = [
  "PENDING",
  "PAID",
  "DISPATCHED",
  "EN_ROUTE",
  "SHOOTING",
  "SYNCING",
  "EDITING",
  "DELIVERED",
  "CANCELLED",
] as const;

const partnerTransitions = new Map<string, string[]>([
  ["DISPATCHED", ["EN_ROUTE"]],
  ["EN_ROUTE", ["SHOOTING"]],
  ["SHOOTING", ["SYNCING"]],
]);

function canTransitionStatus(currentStatus: string, newStatus: string, userRole: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (!bookingStates.includes(newStatus as (typeof bookingStates)[number])) return false;
  if (newStatus === "DELIVERED") return userRole === "EDITOR";
  if (newStatus === "EN_ROUTE" || newStatus === "SHOOTING" || newStatus === "SYNCING") {
    return userRole === "PARTNER" && partnerTransitions.get(currentStatus)?.includes(newStatus) === true;
  }
  if (newStatus === "EDITING") return userRole === "ADMIN" || userRole === "EDITOR";
  if (newStatus === "CANCELLED") return userRole === "CLIENT" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  return false;
}

describe("ORBIT booking state contract", () => {
  it("contains the authoritative production states", () => {
    expect(bookingStates).toEqual([
      "PENDING",
      "PAID",
      "DISPATCHED",
      "EN_ROUTE",
      "SHOOTING",
      "SYNCING",
      "EDITING",
      "DELIVERED",
      "CANCELLED",
    ]);
  });

  it("requires partner acceptance before EN_ROUTE", () => {
    expect(canTransitionStatus("DISPATCHED", "EN_ROUTE", "PARTNER")).toBe(true);
    expect(canTransitionStatus("PAID", "EN_ROUTE", "PARTNER")).toBe(false);
  });

  it("allows the partner to advance the shooting lifecycle in order", () => {
    expect(canTransitionStatus("EN_ROUTE", "SHOOTING", "PARTNER")).toBe(true);
    expect(canTransitionStatus("SHOOTING", "SYNCING", "PARTNER")).toBe(true);
    expect(canTransitionStatus("DISPATCHED", "SHOOTING", "PARTNER")).toBe(false);
  });

  it("allows only an editor to deliver an editing job", () => {
    expect(canTransitionStatus("EDITING", "DELIVERED", "EDITOR")).toBe(true);
    expect(canTransitionStatus("EDITING", "DELIVERED", "CLIENT")).toBe(false);
    expect(canTransitionStatus("EDITING", "DELIVERED", "PARTNER")).toBe(false);
  });

  it("keeps admin override explicit", () => {
    expect(canTransitionStatus("PENDING", "DELIVERED", "ADMIN")).toBe(true);
    expect(canTransitionStatus("PENDING", "DELIVERED", "SUPER_ADMIN")).toBe(true);
  });
});
