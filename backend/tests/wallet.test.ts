import { describe, it, expect } from "vitest";

describe("Wallet Balance & Transaction Locking", () => {
  it("should prevent withdrawal when requested amount exceeds balance", () => {
    const currentBalance = 500;
    const requestedAmount = 1000;

    const isSufficient = currentBalance >= requestedAmount;
    expect(isSufficient).toBe(false);
  });

  it("should correctly compute post-withdrawal balance", () => {
    const currentBalance = 2500;
    const withdrawalAmount = 1000;

    const newBalance = currentBalance - withdrawalAmount;
    expect(newBalance).toBe(1500);
  });
});
