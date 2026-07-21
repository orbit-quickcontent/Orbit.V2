/**
 * Backend API | Booking Sync Complete Handler using Firestore
 *
 * This endpoint is called when the partner finishes uploading all raw footage files.
 * It updates the booking status to EDITING, credits the partner's wallet, records the
 * transaction, and broadcasts the status update.
 *
 * Endpoint: POST /api/bookings/[id]/sync-complete
 */

import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { footageUrls, fileName, fileSize } = body;

    if (!Array.isArray(footageUrls) || footageUrls.length === 0) {
      return NextResponse.json(
        { error: "footageUrls array is required and cannot be empty" },
        { status: 400 }
      );
    }

    // 1. Fetch booking from Firestore
    const booking = await firestoreDb.bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.partnerId) {
      return NextResponse.json(
        { error: "No partner assigned to this booking" },
        { status: 400 }
      );
    }

    const pkg = await firestoreDb.packages.findUnique({
      where: { id: booking.packageId }
    });

    if (!pkg) {
      return NextResponse.json(
        { error: "Package not found for this booking" },
        { status: 404 }
      );
    }

    const alreadyCredited = ["READY_TO_EDIT", "EDITING", "DELIVERED"].includes(booking.status);

    // 2. Update booking: status to READY_TO_EDIT, syncPercentage to 100, save footageUrls in Firestore
    const updatedRaw = await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        status: "READY_TO_EDIT",
        syncPercentage: 100,
        footageUrls: JSON.stringify(footageUrls),
      },
    });

    const clientUser = await firestoreDb.clientUsers.findUnique({
      where: { id: updatedRaw.userId }
    });

    // Fetch partner details from Firestore in-memory
    const partnerData = await firestoreDb.partners.findUnique({
      where: { id: booking.partnerId },
    });

    let resolvedPartner = null;
    if (partnerData) {
      const partnerUser = await firestoreDb.partnerUsers.findUnique({
        where: { id: partnerData.userId },
      });
      resolvedPartner = {
        ...partnerData,
        user: partnerUser ? {
          id: partnerUser.id,
          name: partnerUser.name,
          phone: partnerUser.phone,
        } : null,
      };
    }

    const updatedBooking = {
      ...updatedRaw,
      user: clientUser,
      partner: resolvedPartner,
    };

    // 3. Credit Partner's Wallet in Firestore if not already done
    if (!alreadyCredited) {
      const partnerPayout = 700;
      const partner = await firestoreDb.partners.findUnique({
        where: { id: booking.partnerId },
      });

      if (partner) {
        await firestoreDb.partners.update({
          where: { id: booking.partnerId },
          data: {
            walletBalance: (partner.walletBalance || 0) + partnerPayout,
            completedProjects: (partner.completedProjects || 0) + 1,
          },
        });

        // Record the Earning Transaction in Firestore
        await firestoreDb.transactions.create({
          data: {
            partnerId: booking.partnerId,
            bookingId: bookingId,
            type: "EARNING",
            amount: partnerPayout,
            status: "COMPLETED",
            description: `Salary payout for shoot ${bookingId.substring(0, 8)}... (${pkg.name ?? "Package"})`,
          },
        });
      }
    }

    // 4. Notify WebSocket service about status change to READY_TO_EDIT
    try {
      await fetch("http://localhost:3003/internal/notify-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          event: "booking:status-update",
          payload: {
            bookingId,
            status: "READY_TO_EDIT",
            previousStatus: booking.status,
          },
        }),
      });
    } catch (wsError) {
      console.error("Failed to notify WebSocket service of sync-complete:", wsError);
    }

    // Return the editor metadata dashboard item payload
    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        syncPercentage: updatedBooking.syncPercentage,
        footageUrls,
        fileName: fileName || (footageUrls[footageUrls.length - 1]?.split("/").pop() ?? ""),
        fileSize: fileSize || 0,
        editorRequirements: updatedBooking.user?.editorRequirements || "",
        brandLogo: updatedBooking.user?.brandLogo || null,
        brandFont: updatedBooking.user?.brandFont || null,
        brandColor: updatedBooking.user?.brandColor || null,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in sync-complete handler:", error);
    return NextResponse.json(
      { error: "Failed to complete sync" },
      { status: 500 }
    );
  }
}
