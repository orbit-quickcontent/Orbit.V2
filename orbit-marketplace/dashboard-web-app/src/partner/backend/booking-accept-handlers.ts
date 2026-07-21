/**
 * Partner Backend | Booking Accept Handlers
 *
 * Partner accepts a dispatched booking using Firestore:
 * - Updates WorkDispatch to ACCEPTED
 * - Assigns partner to booking, sets status EN_ROUTE
 * - Expires all other PENDING dispatches for this booking
 * - Notifies WebSocket (client + other partners)
 *
 * Re-exported by: src/app/api/bookings/[id]/accept/route.ts
 * Category: Partner Backend
 */

import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface AcceptBody {
  partnerId: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const body: AcceptBody = await request.json()
    const { partnerId } = body

    if (!partnerId) {
      return NextResponse.json(
        { error: 'partnerId is required' },
        { status: 400 }
      )
    }

    // 1. Find the booking, verify it's in PARTNER_DISPATCHED status
    const booking = await firestoreDb.bookings.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status !== 'PARTNER_DISPATCHED') {
      return NextResponse.json(
        { error: `Booking is not dispatched. Current status: ${booking.status}` },
        { status: 400 }
      )
    }

    if (booking.partnerId) {
      return NextResponse.json(
        { error: 'Booking already has a partner assigned' },
        { status: 400 }
      )
    }

    // 2. Find the WorkDispatch for this partner and booking (status: PENDING)
    const workDispatch = await firestoreDb.workDispatches.findFirst({
      where: {
        bookingId,
        partnerId,
        status: 'PENDING',
      },
    })

    if (!workDispatch) {
      return NextResponse.json(
        { error: 'No pending dispatch found for this partner and booking' },
        { status: 404 }
      )
    }

    // 3. Update the WorkDispatch status to ACCEPTED, set respondedAt
    await firestoreDb.workDispatches.update({
      where: { id: workDispatch.id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date().toISOString(),
      },
    })

    // 4. Update booking: partnerId, status = EN_ROUTE
    const updatedRaw = await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        partnerId,
        status: 'EN_ROUTE',
      },
    })

    const clientUser = await firestoreDb.clientUsers.findUnique({
      where: { id: updatedRaw.userId },
    })

    const pkg = await firestoreDb.packages.findUnique({
      where: { id: updatedRaw.packageId },
    })

    // Fetch partner details from Partner DB in-memory
    const partnerData = await firestoreDb.partners.findUnique({
      where: { id: partnerId },
    })

    let resolvedPartner = null
    if (partnerData) {
      const partnerUser = await firestoreDb.partnerUsers.findUnique({
        where: { id: partnerData.userId },
      })
      resolvedPartner = {
        ...partnerData,
        user: partnerUser ? {
          id: partnerUser.id,
          name: partnerUser.name,
          phone: partnerUser.phone,
          avatar: partnerUser.avatar,
        } : null,
      }
    }

    const updatedBooking = {
      ...updatedRaw,
      user: clientUser ? {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        phone: clientUser.phone,
      } : null,
      package: pkg,
      partner: resolvedPartner,
    }

    // 5. Mark ALL other PENDING WorkDispatches for this booking as EXPIRED
    const otherDispatches = await firestoreDb.workDispatches.findMany({
      where: {
        bookingId,
        status: 'PENDING',
      },
    });

    await Promise.all(
      otherDispatches
        .filter((item) => item.id !== workDispatch.id)
        .map((item) =>
          firestoreDb.workDispatches.update({
            where: { id: item.id },
            data: {
              status: 'EXPIRED',
              respondedAt: new Date().toISOString(),
            },
          })
        )
    );

    // 6. Notify WebSocket: partner accepted (notify client + other partners)
    try {
      await fetch('http://localhost:3003/internal/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          partnerId,
          booking: updatedBooking,
        }),
      })
    } catch (wsError) {
      console.error('Failed to notify WebSocket service:', wsError)
    }

    // 7. Return the updated booking
    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Error accepting booking:', error)
    return NextResponse.json(
      { error: 'Failed to accept booking' },
      { status: 500 }
    )
  }
}
