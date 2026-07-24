import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { packageId, locationAddress, lat, lng, notes } = await req.json();

    // 1. Fetch Package Pricing
    const { data: pkg, error: pkgErr } = await supabaseClient
      .from("packages")
      .select("*")
      .eq("id", packageId)
      .single();

    if (pkgErr || !pkg) throw new Error("Invalid package selection");

    const totalPrice = pkg.price;
    const partnerPayout = Math.round(totalPrice * 0.7);
    const platformCommission = totalPrice - partnerPayout;

    // 2. Extract user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser(token);

    if (userErr || !user) throw new Error("Unauthorized");

    // 3. Create Booking
    const { data: booking, error: bookingErr } = await supabaseClient
      .from("bookings")
      .insert({
        client_id: user.id,
        package_id: packageId,
        location_address: locationAddress,
        latitude: lat,
        longitude: lng,
        total_price: totalPrice,
        partner_payout: partnerPayout,
        platform_commission: platformCommission,
        notes,
        status: "REQUESTED"
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    return new Response(JSON.stringify({ success: true, booking }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
