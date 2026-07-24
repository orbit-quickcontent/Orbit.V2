import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { basePrice, distanceKm, tipAmount = 0 } = await req.json();

    const perKmRate = 25; // ₹25 / km distance fee
    const distanceFee = distanceKm > 5 ? Math.round((distanceKm - 5) * perKmRate) : 0;
    const gst = Math.round((basePrice + distanceFee) * 0.18); // 18% GST
    const totalPrice = basePrice + distanceFee + gst + tipAmount;

    return new Response(
      JSON.stringify({
        success: true,
        breakdown: {
          basePrice,
          distanceFee,
          gst,
          tipAmount,
          totalPrice,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
