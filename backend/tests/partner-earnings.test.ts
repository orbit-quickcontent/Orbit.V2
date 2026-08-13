import { describe, expect, it } from 'vitest';
import { calculatePackageEconomics } from '../src/services/partner-earnings.service';

describe('ORBIT partner earnings economics', () => {
  it('keeps the configured ₹700 partner earning for the ₹1,999 package', () => {
    const economics = calculatePackageEconomics({
      price: 1999,
      partnerPayoutAmount: 700,
      editorPayoutAmount: 0,
      taxAmount: 0,
    });

    expect(economics.grossAmount).toBe(1999);
    expect(economics.partnerEarningAmount).toBe(700);
    expect(economics.platformCommissionAmount).toBe(1299);
  });

  it('keeps the configured ₹700 partner earning for the ₹4,999 package', () => {
    const economics = calculatePackageEconomics({
      price: 4999,
      partnerPayoutAmount: 700,
      editorPayoutAmount: 0,
      taxAmount: 0,
    });

    expect(economics.grossAmount).toBe(4999);
    expect(economics.partnerEarningAmount).toBe(700);
    expect(economics.platformCommissionAmount).toBe(4299);
  });

  it('rejects payout configuration larger than the client price', () => {
    expect(() => calculatePackageEconomics({
      price: 1999,
      partnerPayoutAmount: 2000,
    })).toThrow('Package payout configuration exceeds client price');
  });
});
