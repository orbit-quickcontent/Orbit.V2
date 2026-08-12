/**
 * WalletService — Orbit backend API client
 * Replaces the old Supabase-based implementation.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? (localStorage.getItem("orbit_token") || "") : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface WalletRecord {
  id: string;
  partnerId: string;
  walletBalance: number;
  pendingClearance: number;
  totalWithdrawn: number;
}

export class WalletService {
  static async getPartnerWallet(partnerId: string): Promise<WalletRecord | null> {
    try {
      const res = await fetch(`${API}/partners/${partnerId}/wallet`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.wallet || data || null;
    } catch {
      return null;
    }
  }

  static async requestWithdrawal(partnerId: string, amount: number) {
    const res = await fetch(`${API}/partners/${partnerId}/withdraw`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}
