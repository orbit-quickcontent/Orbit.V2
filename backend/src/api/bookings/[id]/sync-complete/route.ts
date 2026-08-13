import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/services/db.service";
import { assignEditor } from "@/services/editor-assignment.service";
import { notifyClient } from "@/services/websocket.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const { footageUrls, proxyFootageUrl, fileName, fileSize } = (await request.json()) as any;

    if (!Array.isArray(footageUrls) || footageUrls.length === 0) {
      return NextResponse.json({ error: "footageUrls array is required and cannot be empty" }, { status: 400 });
    }

    const booking = await dbClient.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, package: true },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!booking.partnerId) return NextResponse.json({ error: "No partner assigned to this booking" }, { status: 400 });
    if (!["SHOOTING", "SYNCING"].includes(booking.status)) {
      return NextResponse.json({ error: `Booking must be SHOOTING or SYNCING before completing sync. Current status: ${booking.status}` }, { status: 409 });
    }

    const updated = await dbClient.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!current || !["SHOOTING", "SYNCING"].includes(current.status)) {
        throw new Error("Booking changed before sync completion");
      }

      const next = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "EDITING",
          syncPercentage: 100,
          footageUrls: JSON.stringify(footageUrls),
          proxyFootageUrl: proxyFootageUrl ? String(proxyFootageUrl) : null,
        },
        include: { user: true, package: true },
      });

      await tx.partner.update({
        where: { id: current.partnerId! },
        data: {
          walletBalance: { increment: 700 },
          completedProjects: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          partnerId: current.partnerId!,
          bookingId,
          type: "EARNING",
          amount: 700,
          status: "COMPLETED",
          description: `Shoot payout for booking ${bookingId}`,
        },
      });

      return next;
    });

    let editorId: string | null = null;
    let assignmentPending = false;
    try {
      editorId = await assignEditor(bookingId);
    } catch (editorError) {
      assignmentPending = true;
      console.error("[Editor] automatic assignment failed:", editorError);
    }

    notifyClient({
      bookingId,
      event: "booking:status-update",
      data: { bookingId, status: "EDITING", previousStatus: booking.status, reelUrl: null, deliveredAt: null },
    });

    notifyClient({
      bookingId,
      event: "editor:booking-ready",
      data: { bookingId, status: "EDITING", editorId, assignmentPending, footageUrls },
    });

    return NextResponse.json({
      success: true,
      assignmentPending,
      booking: {
        id: updated.id,
        status: updated.status,
        syncPercentage: updated.syncPercentage,
        editorId,
        footageUrls,
        fileName: fileName || String(footageUrls[footageUrls.length - 1] || "").split("/").pop() || "",
        fileSize: fileSize || 0,
        editorRequirements: updated.user?.editorRequirements || "",
        brandLogo: updated.user?.brandLogo || null,
        brandFont: updated.user?.brandFont || null,
        brandColor: updated.user?.brandColor || null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error in sync-complete handler:", error);
    const message = error?.message || "Failed to complete sync";
    return NextResponse.json({ error: message }, { status: message.includes("changed before") ? 409 : 500 });
  }
}
