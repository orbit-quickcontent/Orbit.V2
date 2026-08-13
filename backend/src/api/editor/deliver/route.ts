import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/services/db.service";
import { verifyToken } from "@/lib/security-auth";
import { logAudit } from "@/lib/auth-server";
import { startTranscoding } from "@/services/transcoding.service";
import { releasePartnerEarning } from "@/services/partner-earnings.service";
import { notifyClient, getIo } from "@/services/websocket.service";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization") || "";
    const session = verifyToken(token);
    if (!session || session.type !== "access" || !["EDITOR", "ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, reelUrl } = (await request.json()) as { bookingId?: string; reelUrl?: string };
    if (!bookingId || !reelUrl) return NextResponse.json({ error: "bookingId and reelUrl are required" }, { status: 400 });

    const existingBooking = await dbClient.booking.findUnique({ where: { id: bookingId } });
    if (!existingBooking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (existingBooking.status !== "EDITING") {
      return NextResponse.json({ error: `Booking cannot be delivered unless it is in EDITING status. Current status: ${existingBooking.status}` }, { status: 409 });
    }
    if (session.role === "EDITOR" && existingBooking.editorId !== session.id) {
      return NextResponse.json({ error: "Booking is assigned to a different editor" }, { status: 403 });
    }

    const now = new Date();
    const updated = await dbClient.booking.updateMany({
      where: {
        id: bookingId,
        status: "EDITING",
        ...(session.role === "EDITOR" ? { editorId: session.id } : {}),
      },
      data: {
        status: "DELIVERED",
        masterReelUrl: reelUrl,
        deliveredAt: now,
      },
    });

    if (updated.count !== 1) {
      return NextResponse.json({ error: "Booking changed before delivery" }, { status: 409 });
    }

    try {
      await releasePartnerEarning(bookingId);
    } catch (earningError) {
      console.error("[PartnerEarnings] release failed:", earningError);
      return NextResponse.json({ error: "Reel delivered but partner payout settlement failed" }, { status: 503 });
    }

    const booking = await dbClient.booking.findUnique({ where: { id: bookingId } });
    const partnerEarningAmount = booking?.partnerEarningAmount ?? 0;

    await logAudit({
      userId: session.id,
      action: "DELIVER_REEL",
      entity: "Booking",
      entityId: bookingId,
      details: { reelUrl, partnerEarningAmount },
      req: request,
    });

    startTranscoding(bookingId, reelUrl).catch((error) => {
      console.error("[Transcoding] failed:", error);
    });

    notifyClient({
      bookingId,
      event: "booking:status-update",
      data: {
        bookingId,
        status: "DELIVERED",
        reelUrl,
        masterReelUrl: reelUrl,
        deliveredAt: now.toISOString(),
      },
    });

    getIo()?.to(`booking:${bookingId}`).emit("partner:earning-available", {
      bookingId,
      partnerEarningAmount,
      currency: "INR",
      status: "AVAILABLE",
      availableAt: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      booking,
      partnerEarningAmount,
      partnerEarningStatus: "AVAILABLE",
    });
  } catch (error) {
    console.error("Error in deliver route:", error);
    return NextResponse.json({ error: "Failed to deliver booking" }, { status: 500 });
  }
}
