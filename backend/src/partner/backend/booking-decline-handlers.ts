/**
 * Partner Backend | Booking Decline Handlers
 *
 * Uses the authoritative Redis GEO dispatch decline engine:
 * - Marks partner dispatch as declined
 * - Immediately waterfalls to next nearby candidate
 */

import { NextRequest, NextResponse } from "next/server";
import { declinePartnerOffer } from "@/services/dispatch.service";

interface DeclineBody {
  partnerId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body: DeclineBody = ((await request.json()) as any) || {};
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const declineResult = await declinePartnerOffer(bookingId, partnerId);

    return NextResponse.json({
      success: true,
      message: declineResult.message,
    });
  } catch (error) {
    console.error("Error declining booking:", error);
    return NextResponse.json({ error: "Failed to decline booking" }, { status: 500 });
  }
}
