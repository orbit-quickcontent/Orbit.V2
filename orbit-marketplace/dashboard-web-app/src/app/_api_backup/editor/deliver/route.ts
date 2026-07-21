import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";
import { logAudit } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, reelUrl, editorId } = body;

    if (!bookingId || !reelUrl) {
      return NextResponse.json(
        { error: "bookingId and reelUrl are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const booking = await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        status: "DELIVERED",
        reelUrl: reelUrl,
        deliveredAt: now,
        reelUploadedAt: now
      }
    });

    // Record audit log
    await logAudit({
      userId: editorId || "editor_1",
      action: "DELIVER_REEL",
      entity: "Booking",
      entityId: bookingId,
      details: { reelUrl },
      req: request
    });

    // Trigger WebSocket status change to DELIVERED
    try {
      await fetch("http://localhost:3003/internal/notify-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          event: "booking:status-update",
          payload: {
            bookingId,
            status: "DELIVERED",
            reelUrl: reelUrl,
            deliveredAt: now
          }
        })
      });
    } catch (wsError) {
      console.error("Failed to notify WebSocket of delivery:", wsError);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error in deliver route:", error);
    return NextResponse.json(
      { error: "Failed to deliver booking" },
      { status: 500 }
    );
  }
}
