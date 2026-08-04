import { supabase } from "@/lib/supabase-client";

export interface CreateBookingPayload {
  packageId: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  totalPrice: number;
  partnerPayout: number;
  platformCommission: number;
  notes?: string;
}

export class BookingService {
  static async createBooking(payload: CreateBookingPayload) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        client_id: user.id,
        package_id: payload.packageId,
        location_address: payload.locationAddress,
        latitude: payload.latitude,
        longitude: payload.longitude,
        total_price: payload.totalPrice,
        partner_payout: payload.partnerPayout,
        platform_commission: payload.platformCommission,
        notes: payload.notes,
        status: 'REQUESTED',
        payment_status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async fetchClientBookings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select('*, packages(*), shoot_tracking(*)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static subscribeToBookingRealtime(bookingId: string, onUpdate: (payload: any) => void) {
    return supabase
      .channel(`booking:${bookingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
        (payload) => onUpdate(payload.new)
      )
      .subscribe();
  }
}
