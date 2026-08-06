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
import { notifyClient } from "@/services/websocket.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const { footageUrls, proxyFootageUrl, fileName, fileSize } = (await request.json()) as any;

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

    const validPreSyncStatuses = ["ACCEPTED", "EN_ROUTE", "SHOOTING", "SYNCING"];
    if (!validPreSyncStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: `Booking must be ACCEPTED before completing sync. Current status: ${booking.status}` },
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

    // 2. Update booking: set status, syncPercentage to 100, save footageUrls and proxyFootageUrl in Firestore
    //    We store READY_TO_EDIT so the editor dashboard can filter on it,
    //    but we will emit EDITING to the client WebSocket below so the
    //    client pipeline advances to the Editing step.
    const updatedRaw = await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        status: "READY_TO_EDIT",
        syncPercentage: 100,
        footageUrls: JSON.stringify(footageUrls),
        proxyFootageUrl: proxyFootageUrl ? (typeof proxyFootageUrl === 'string' ? proxyFootageUrl : JSON.stringify(proxyFootageUrl)) : null,
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

        // Record the Payout Transaction in Firestore
        await firestoreDb.transactions.create({
          data: {
            partnerId: booking.partnerId,
            bookingId: bookingId,
            type: "PAYOUT",
            amount: partnerPayout,
            status: "COMPLETED",
            description: `Salary payout for shoot ${bookingId.substring(0, 8)}... (${pkg.name ?? "Package"})`,
          },
        });
      }
    }

    // 4. Notify WebSocket service (in-process)
    notifyClient({
      bookingId,
      event: "booking:status-update",
      data: { bookingId, status: "EDITING", previousStatus: booking.status, reelUrl: null, deliveredAt: null },
    })
    notifyClient({
      bookingId,
      event: "editor:booking-ready",
      data: { bookingId, status: "READY_TO_EDIT", footageUrls },
    })

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
