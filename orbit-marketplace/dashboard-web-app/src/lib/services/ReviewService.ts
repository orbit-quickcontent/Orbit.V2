import { supabase } from "@/lib/supabase-client";

export class ReviewService {
  static async submitReview(bookingId: string, partnerId: string, rating: number, comment?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        client_id: user.id,
        partner_id: partnerId,
        rating,
        comment
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
