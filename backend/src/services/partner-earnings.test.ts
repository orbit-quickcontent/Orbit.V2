import { describe, expect, it } from 'vitest';
import { calculatePackageEconomics } from './partner-earnings.service';

describe('partner earnings economics', () => {
  it('calculates the configured ₹700 partner earning before acceptance', () => {
    const economics = calculatePackageEconomics({
      price: 1999,
      partnerPayoutAmount: 700,
      editorPayoutAmount: 0,
      taxAmount: 0,
    });

    expect(economics.partnerEarningAmount).toBe(700);
    expect(economics.grossAmount).toBe(1999);
    expect(economics.platformCommissionAmount).toBe(1299);
  });

  it('never allows payout configuration to exceed the client price', () => {
    expect(() => calculatePackageEconomics({
      price: 1000,
      partnerPayoutAmount: 700,
      editorPayoutAmount: 400,
      taxAmount: 0,
    })).toThrow('Package payout configuration exceeds client price');
  });
});
