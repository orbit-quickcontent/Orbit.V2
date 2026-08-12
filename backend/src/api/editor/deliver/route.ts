import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";
import { logAudit } from "@/lib/auth-server";
import { startTranscoding } from "@/services/transcoding.service";
import { notifyClient } from "@/services/websocket.service";

export async function POST(request: NextRequest) {
  try {
    const { bookingId, reelUrl, editorId } = (await request.json()) as any;

    if (!bookingId || !reelUrl) {
      return NextResponse.json(
        { error: "bookingId and reelUrl are required" },
        { status: 400 }
      );
    }

    const existingBooking = await firestoreDb.bookings.findUnique({
      where: { id: bookingId }
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (existingBooking.status !== "EDITING") {
      return NextResponse.json(
        { error: `Booking cannot be delivered unless it is in EDITING status. Current status: ${existingBooking.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const booking = await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        status: "DELIVERED",
        reelUrl: reelUrl,
        masterReelUrl: reelUrl,
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

    // Trigger background transcoding asynchronously (do not await to let response return immediately)
    startTranscoding(bookingId, reelUrl).catch((transcodeErr) => {
      console.error("Transcoding failed:", transcodeErr);
    });

    // Trigger WebSocket status change to DELIVERED (in-process)
    notifyClient({
      bookingId,
      event: "booking:status-update",
      data: { bookingId, status: "DELIVERED", reelUrl, masterReelUrl: reelUrl, deliveredAt: now },
    })

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error in deliver route:", error);
    return NextResponse.json(
      { error: "Failed to deliver booking" },
      { status: 500 }
    );
  }
}
