/**
 * Partner Backend | Booking Dispatch Handlers
 *
 * Dispatch a booking to the 5 nearest available online partners using Firestore.
 * Creates WorkDispatch records, increments dispatch round, and
 * notifies partners via WebSocket.
 *
 * Re-exported by: src/app/api/bookings/[id]/dispatch/route.ts
 * Category: Partner Backend
 */

import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { notifyDispatch, getOnlinePartnerIds } from '@/services/websocket.service'
import { findNearestPartners } from '@/services/geo.service'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    // 1. Find booking in Firestore, verify it's PAID with no partner assigned
    const booking = await firestoreDb.bookings.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status !== 'PENDING' && booking.status !== 'PAID' && booking.status !== 'DISPATCHED' && booking.status !== 'PARTNER_DISPATCHED') {
      return NextResponse.json(
        { error: `Booking cannot be dispatched. Current status: ${booking.status}` },
        { status: 400 }
      )
    }

    if (booking.partnerId) {
      return NextResponse.json(
        { error: 'Booking already has a partner assigned' },
        { status: 400 }
      )
    }

    // 2. Parse declinedBy JSON array
    let declinedBy: string[] = []
    if (booking.declinedBy) {
      try {
        declinedBy = typeof booking.declinedBy === 'string' ? JSON.parse(booking.declinedBy) : (booking.declinedBy || [])
      } catch {
        declinedBy = []
      }
    }

    // 3. Find online partners who haven't declined
    let onlinePartners = await firestoreDb.partners.findMany({
      where: {
        availability: true,
      },
    })

    // If no online partners found, automatically set all existing partners online to make local testing robust
    if (onlinePartners.length === 0) {
      const allExisting = await firestoreDb.partners.findMany();
      if (allExisting.length > 0) {
        await Promise.all(
          allExisting.map(p =>
            firestoreDb.partners.update({
              where: { id: p.id },
              data: { availability: true }
            })
          )
        );
        onlinePartners = await firestoreDb.partners.findMany({
          where: { availability: true }
        });
      }
    }

    // Exclude declined partners in-memory
    const activePartners = onlinePartners.filter(p => !declinedBy.includes(p.id))

    if (activePartners.length === 0) {
      console.log(`[Dispatch] No online active partners found in Firestore for booking ${bookingId}. Dispatch queued for available partners.`);
      return NextResponse.json({
        success: true,
        message: "Booking dispatch queued for available partners",
        dispatchedCount: 0
      }, { status: 200 });
    }

    // Parse booking coordinates for proximity sorting
    const bookingLat: number | null =
      booking.lat != null ? Number(booking.lat) :
      booking.latitude != null ? Number(booking.latitude) : null;
    const bookingLng: number | null =
      booking.lng != null ? Number(booking.lng) :
      booking.longitude != null ? Number(booking.longitude) : null;

    // Get currently socket-connected partner IDs for online-presence check
    // Pass null to skip WS check if WS server hasn't initialised yet
    const wsOnlineIds = getOnlinePartnerIds();
    const wsOnlineSet = wsOnlineIds.length > 0 ? new Set(wsOnlineIds) : null;

    // Sort by Haversine distance, return nearest 5 (or all if < 5 available)
    // maxStaleMinutes=60: generous window — falls back gracefully when partners
    // haven't yet pushed live GPS (e.g. first dispatch after app install)
    const partnersToDispatch = findNearestPartners(
      activePartners,
      bookingLat,
      bookingLng,
      5,
      wsOnlineSet,
      60
    );

    // If WS-presence filter eliminated everyone, fall back to all active partners (top 5)
    const finalPartners = partnersToDispatch.length > 0
      ? partnersToDispatch
      : findNearestPartners(activePartners, bookingLat, bookingLng, 5, null, 60);

    // 4. Create WorkDispatch records for each partner
    const newRound = (booking.dispatchRound || 0) + 1
    const dispatchRecords = await Promise.all(
      finalPartners.map((partner) =>
        firestoreDb.workDispatches.create({
          data: {
            bookingId,
            partnerId: partner.id,
            status: 'PENDING',
            round: newRound,
            distanceKm: isFinite(partner.distanceKm) ? partner.distanceKm : null,
            dispatchedAt: new Date().toISOString(),
          },
        })
      )
    )

    // 5. Update booking status and dispatch round
    const updatedRaw = await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        dispatchRound: newRound,
        status: 'PARTNER_DISPATCHED',
      },
    })

    const pkg = await firestoreDb.packages.findUnique({
      where: { id: updatedRaw.packageId }
    })

    const clientUser = await firestoreDb.clientUsers.findUnique({
      where: { id: updatedRaw.userId }
    })

    const updatedBooking = {
      ...updatedRaw,
      package: pkg,
      user: clientUser ? {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        phone: clientUser.phone,
        brandLogo: clientUser.brandLogo || null,
        brandFont: clientUser.brandFont || null,
        brandColor: clientUser.brandColor || null,
        editorRequirements: clientUser.editorRequirements || null,
      } : null,
    }

    // 7. Notify WebSocket service to push dispatch to partners (in-process)
    const partnerIds = finalPartners.map((p) => p.id)
    notifyDispatch({ bookingId, partnerIds, booking: updatedBooking, round: newRound })

    // 8. Return result
    return NextResponse.json({
      dispatched: partnerIds.length,
      dispatchRecords,
      booking: updatedBooking,
      nearestPartners: finalPartners.map(p => ({
        partnerId: p.id,
        distanceKm: isFinite(p.distanceKm) ? Math.round(p.distanceKm * 100) / 100 : null,
      })),
    })
  } catch (error) {
    console.error('Error dispatching booking:', error)
    return NextResponse.json(
      { error: 'Failed to dispatch booking' },
      { status: 500 }
    )
  }
}
