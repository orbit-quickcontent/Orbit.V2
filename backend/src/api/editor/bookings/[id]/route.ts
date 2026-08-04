import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    const booking = await firestoreDb.bookings.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const client = await firestoreDb.clientUsers.findUnique({
      where: { id: booking.userId }
    });

    const pkg = await firestoreDb.packages.findUnique({
      where: { id: booking.packageId }
    });

    const parseArrayField = (field: any): any[] => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === "string") {
        try {
          const parsed = JSON.parse(field);
          if (Array.isArray(parsed)) return parsed;
          return [parsed];
        } catch (_) {
          return [field];
        }
      }
      return [];
    };

    const footageUrls = parseArrayField(booking.footageUrls);
    const proxyFootageUrls = parseArrayField(booking.proxyFootageUrl);

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        footageUrls,
        proxyFootageUrls,
        client: client ? {
          id: client.id,
          name: client.name || "Client",
          email: client.email,
          brandColor: client.brandColor,
          brandFont: client.brandFont,
          brandLogo: client.brandLogo,
          editorRequirements: client.editorRequirements
        } : null,
        package: pkg
      }
    });
  } catch (error) {
    console.error("Error fetching booking details for editor:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking details" },
      { status: 500 }
    );
  }
}

/**
 * POST /editor/bookings/:id
 *
 * Editor explicitly ACCEPTS a booking that is READY_TO_EDIT.
 * - Rejects if the booking isn't ready for editing yet.
 * - Rejects if another editor has already claimed it (race protection).
 * - Idempotent if the same editor re-accepts their own booking.
 * - Assigns editorId, moves status PENDING->EDITING, notifies WebSocket
 *   so the client and admin dashboard see the update immediately.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body: any = await request.json();
    const { editorId } = body;

    if (!editorId) {
      return NextResponse.json(
        { error: "editorId is required" },
        { status: 400 }
      );
    }

    const booking = await firestoreDb.bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Already accepted by someone else -> reject
    if (booking.editorId && booking.editorId !== editorId) {
      return NextResponse.json(
        { error: "This project has already been accepted by another editor" },
        { status: 409 }
      );
    }

    // Must be footage-ready before an editor can accept it
    if (booking.status !== "READY_TO_EDIT" && booking.status !== "EDITING") {
      return NextResponse.json(
        { error: `Booking is not ready to be edited. Current status: ${booking.status}` },
        { status: 400 }
      );
    }

    const updatedRaw = await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        editorId,
        status: "EDITING",
      },
    });

    // Notify WebSocket: editor has accepted, status now EDITING
    try {
      await fetch("http://localhost:3003/internal/notify-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          event: "booking:status-update",
          payload: {
            bookingId,
            status: "EDITING",
            previousStatus: booking.status,
            editorId,
          },
        }),
      });
    } catch (wsError) {
      console.error("Failed to notify WebSocket of editor acceptance:", wsError);
    }

    return NextResponse.json({ success: true, booking: updatedRaw });
  } catch (error) {
    console.error("Error accepting booking for editor:", error);
    return NextResponse.json(
      { error: "Failed to accept booking" },
      { status: 500 }
    );
  }
}

