/**
 * ORBIT QuickContent — Centralized Package Economics Engine
 *
 * Authoritative single source of truth for platform pricing, partner payouts,
 * editor payouts, tax snapshots, and platform commission.
 *
 * Rules:
 * - Package 1 (Personalized): ₹1,999 gross -> Partner: ₹700, Editor: ₹500, Tax: ₹0, Platform: ₹799
 * - Package 2 (Professional UGC): ₹4,999 gross -> Partner: ₹700, Editor: ₹500, Tax: ₹0, Platform: ₹3,799
 * - Rejects any package configuration where: partnerPayout + editorPayout + tax > gross
 */

export interface PackageEconomics {
  tier: "PERSONALIZED" | "PROFESSIONAL";
  name: string;
  grossAmount: number;
  partnerEarningAmount: number; // Guaranteed ₹700
  editorPayoutAmount: number;
  taxAmount: number;
  platformCommissionAmount: number;
  currency: string;
  deliveryTime: string;
}

export interface FinancialSnapshot {
  grossAmount: number;
  partnerEarningAmount: number;
  editorPayoutAmount: number;
  taxAmount: number;
  platformCommissionAmount: number;
  currency: string;
}

export const CENTRALIZED_PACKAGE_ECONOMICS: Record<string, PackageEconomics> = {
  PERSONALIZED: {
    tier: "PERSONALIZED",
    name: "Personalized",
    grossAmount: 1999,
    partnerEarningAmount: 700, // Centralized authoritative partner earning
    editorPayoutAmount: 500,
    taxAmount: 0,
    platformCommissionAmount: 799, // 1999 - 700 - 500 - 0 = 799
    currency: "INR",
    deliveryTime: "60-120 mins",
  },
  PROFESSIONAL: {
    tier: "PROFESSIONAL",
    name: "Professional (UGC)",
    grossAmount: 4999,
    partnerEarningAmount: 700, // Centralized authoritative partner earning
    editorPayoutAmount: 500,
    taxAmount: 0,
    platformCommissionAmount: 3799, // 4999 - 700 - 500 - 0 = 3799
    currency: "INR",
    deliveryTime: "60-120 mins",
  },
};

/**
 * Validate package economic values.
 * Throws an error if payouts and taxes exceed gross revenue.
 */
export function validateEconomics(economics: {
  grossAmount: number;
  partnerEarningAmount: number;
  editorPayoutAmount: number;
  taxAmount: number;
}): void {
  const totalDeductions = economics.partnerEarningAmount + economics.editorPayoutAmount + economics.taxAmount;
  if (totalDeductions > economics.grossAmount) {
    throw new Error(
      `Invalid package economics: Total deductions (₹${totalDeductions}) exceed gross amount (₹${economics.grossAmount})`
    );
  }
}

/**
 * Get package economics by tier or price.
 */
export function getPackageEconomics(tierOrPrice: string | number): PackageEconomics {
  if (typeof tierOrPrice === "number") {
    if (tierOrPrice <= 2500) {
      return CENTRALIZED_PACKAGE_ECONOMICS.PERSONALIZED;
    }
    return CENTRALIZED_PACKAGE_ECONOMICS.PROFESSIONAL;
  }

  const normalized = tierOrPrice.toUpperCase().trim();
  if (normalized.includes("PRO") || normalized.includes("UGC") || normalized === "4999" || normalized === "PKG-2") {
    return CENTRALIZED_PACKAGE_ECONOMICS.PROFESSIONAL;
  }
  return CENTRALIZED_PACKAGE_ECONOMICS.PERSONALIZED;
}

/**
 * Freeze an immutable financial snapshot for a new booking.
 * Once frozen at booking creation, these values must NEVER be recalculated from a changed package later.
 */
export function createFinancialSnapshot(tierOrPrice: string | number): FinancialSnapshot {
  const economics = getPackageEconomics(tierOrPrice);
  validateEconomics(economics);

  return {
    grossAmount: economics.grossAmount,
    partnerEarningAmount: economics.partnerEarningAmount, // ₹700
    editorPayoutAmount: economics.editorPayoutAmount,
    taxAmount: economics.taxAmount,
    platformCommissionAmount: economics.platformCommissionAmount,
    currency: economics.currency,
  };
}
