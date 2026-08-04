import { supabase } from "@/lib/supabase-client";

export class PartnerService {
  static async updateGPSLocation(lat: number, lng: number, speed = 0, heading = 0, accuracy = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const { error } = await supabase
      .from('partner_locations')
      .insert({
        partner_id: user.id,
        latitude: lat,
        longitude: lng,
        speed,
        heading,
        accuracy
      });

    if (error) throw error;
  }

  static async setStatus(status: 'ONLINE' | 'OFFLINE' | 'BUSY') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', user.id);

    if (error) throw error;
  }
}
