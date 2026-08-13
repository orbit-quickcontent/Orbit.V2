/**
 * Editor Backend | Deliver Master Reel
 *
 * Calls the authoritative editor delivery service:
 * - Enforces editor ownership & EDITING state
 * - Updates masterReelUrl and DELIVERED timestamp
 * - Triggers single authoritative partner earning settlement (+₹700)
 * - Emits real-time reel_delivered event
 */

import { NextRequest, NextResponse } from "next/server";
import { deliverMasterReel } from "@/services/editor.service";
import { verifyToken } from "@/lib/security-auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as any;
    const { bookingId, reelUrl, masterReelUrl, notes } = body;
    const targetUrl = masterReelUrl || reelUrl;

    if (!bookingId || !targetUrl) {
      return NextResponse.json(
        { error: "bookingId and masterReelUrl/reelUrl are required" },
        { status: 400 }
      );
    }

    // Extract editor identity from Bearer token
    let editorId = body.editorId || "editor";
    let editorRole = "EDITOR";

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) {
      const payload = verifyToken(token);
      if (payload?.id) editorId = payload.id;
      if (payload?.role) editorRole = payload.role as string;
    }

    const deliveryResult = await deliverMasterReel({
      bookingId,
      editorId,
      editorRole,
      masterReelUrl: targetUrl,
      notes,
    });

    if (!deliveryResult.success) {
      return NextResponse.json(
        { error: deliveryResult.error?.message || "Delivery failed", code: deliveryResult.error?.code },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: deliveryResult.booking,
      message: deliveryResult.message,
    });
  } catch (error) {
    console.error("Error in deliver route:", error);
    return NextResponse.json({ error: "Failed to deliver booking" }, { status: 500 });
  }
}
