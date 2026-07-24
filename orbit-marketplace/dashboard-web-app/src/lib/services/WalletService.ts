import { supabase } from "@/lib/supabase-client";

export interface WalletRecord {
  id: string;
  partner_id: string;
  balance: number;
  pending_clearance: number;
  total_withdrawn: number;
}

export class WalletService {
  static async getPartnerWallet(): Promise<WalletRecord | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('partner_id', user.id)
      .single();

    if (error || !data) return null;
    return data as WalletRecord;
  }

  static async requestWithdrawal(amount: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const wallet = await this.getPartnerWallet();
    if (!wallet || wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        amount,
        type: 'WITHDRAWAL',
        description: `Payout withdrawal request for ₹${amount}`,
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
