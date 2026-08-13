/**
 * Partner Backend | Booking Accept Handlers
 *
 * Uses the authoritative Redis GEO dispatch acceptance engine:
 * - Distributed mutex lock preventing dual acceptance
 * - Atomic conditional update to canonical EN_ROUTE state
 * - Automatic PartnerEarning creation with guaranteed ₹700 snapshot
 * - Real-time WebSocket emission to client and other candidates
 */

import { NextRequest, NextResponse } from "next/server";
import { firestoreDb } from "@/lib/db";
import { acceptPartnerOffer } from "@/services/dispatch.service";

interface AcceptBody {
  partnerId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body: AcceptBody = ((await request.json()) as any) || {};
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const partner = await firestoreDb.partners.findUnique({ where: { id: partnerId } });
    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const partnerUser = partner.userId
      ? await firestoreDb.partnerUsers.findUnique({ where: { id: partner.userId } })
      : null;
    const partnerName = partnerUser?.name || "Assigned Partner";

    // Perform atomic acceptance through authoritative dispatch service
    const acceptResult = await acceptPartnerOffer(bookingId, partnerId, partnerName);

    if (!acceptResult.success) {
      return NextResponse.json(
        { error: acceptResult.message, code: "ACCEPT_FAILED" },
        { status: 400 }
      );
    }

    const booking = acceptResult.booking || (await firestoreDb.bookings.findUnique({ where: { id: bookingId } }));
    const pkg = await firestoreDb.packages.findUnique({ where: { id: booking.packageId } });
    const clientUser = await firestoreDb.clientUsers.findUnique({ where: { id: booking.userId } });

    const bookingResponse = {
      ...booking,
      partnerEarningAmount: booking.partnerEarningAmount || 700,
      earningAmount: booking.partnerEarningAmount || 700, // Compatibility alias
      user: clientUser ? { id: clientUser.id, name: clientUser.name, email: clientUser.email, phone: clientUser.phone } : null,
      package: pkg,
      partner: {
        ...partner,
        user: partnerUser ? { id: partnerUser.id, name: partnerUser.name, phone: partnerUser.phone, avatar: partnerUser.avatar } : null,
      },
    };

    return NextResponse.json({
      success: true,
      booking: bookingResponse,
      message: "Booking offer successfully accepted.",
    });
  } catch (error) {
    console.error("Error accepting booking:", error);
    return NextResponse.json({ error: "Failed to accept booking" }, { status: 500 });
  }
}
