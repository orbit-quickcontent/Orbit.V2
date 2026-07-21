/**
 * Partner Backend | Booking Decline Handlers
 *
 * Partner declines a dispatched booking using Firestore:
 * - Updates WorkDispatch to DECLINED
 * - Adds partnerId to booking's declinedBy JSON array
 * - If all partners for this round have declined/expired, auto re-dispatch
 *
 * Re-exported by: src/app/api/bookings/[id]/decline/route.ts
 * Category: Partner Backend
 */

import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface DeclineBody {
  partnerId: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const body: DeclineBody = await request.json()
    const { partnerId } = body

    if (!partnerId) {
      return NextResponse.json(
        { error: 'partnerId is required' },
        { status: 400 }
      )
    }

    // 1. Find the WorkDispatch in Firestore
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

    // 2. Update WorkDispatch status to DECLINED, set respondedAt
    await firestoreDb.workDispatches.update({
      where: { id: workDispatch.id },
      data: {
        status: 'DECLINED',
        respondedAt: new Date().toISOString(),
      },
    })

    // 3. Add partnerId to booking's declinedBy JSON array
    const booking = await firestoreDb.bookings.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    let declinedBy: string[] = []
    if (booking.declinedBy) {
      try {
        declinedBy = typeof booking.declinedBy === 'string' ? JSON.parse(booking.declinedBy) : (booking.declinedBy || [])
      } catch {
        declinedBy = []
      }
    }

    if (!declinedBy.includes(partnerId)) {
      declinedBy.push(partnerId)
    }

    await firestoreDb.bookings.update({
      where: { id: bookingId },
      data: {
        declinedBy: JSON.stringify(declinedBy),
      },
    })

    // 4. Check if ALL dispatched partners for this round have declined/expired
    const currentRoundDispatches = await firestoreDb.workDispatches.findMany({
      where: {
        bookingId,
        round: booking.dispatchRound,
      },
    })

    const allResponded = currentRoundDispatches.every(
      (wd) => wd.status === 'DECLINED' || wd.status === 'EXPIRED' || wd.status === 'CANCELLED'
    )

    let reDispatched = false

    // 5. If all declined/expired, auto-trigger re-dispatch
    if (allResponded) {
      try {
        const onlinePartners = await firestoreDb.partners.findMany({
          where: { availability: true },
        })

        // Exclude already declined partners in-memory
        const availablePartners = onlinePartners.filter(p => !declinedBy.includes(p.id))

        if (availablePartners.length > 0) {
          const newRound = (booking.dispatchRound || 0) + 1
          const partnersToDispatch = availablePartners.slice(0, 5)

          // Create WorkDispatch records
          await Promise.all(
            partnersToDispatch.map((partner) =>
              firestoreDb.workDispatches.create({
                data: {
                  bookingId,
                  partnerId: partner.id,
                  status: 'PENDING',
                  round: newRound,
                },
              })
            )
          )

          // Update booking dispatch round and keep PARTNER_DISPATCHED status
          await firestoreDb.bookings.update({
            where: { id: bookingId },
            data: {
              dispatchRound: newRound,
              status: 'PARTNER_DISPATCHED',
            },
          })

          // Notify WebSocket
          const partnerIds = partnersToDispatch.map((p) => p.id)
          try {
            await fetch('http://localhost:3003/internal/dispatch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId,
                partnerIds,
                round: newRound,
              }),
            })
          } catch (wsError) {
            console.error('Failed to notify WebSocket service for re-dispatch:', wsError)
          }

          reDispatched = true
        } else {
          // No more available partners — mark booking accordingly
          await firestoreDb.bookings.update({
            where: { id: bookingId },
            data: {
              status: 'PAID', // Reset to PAID so it can be manually re-dispatched later
            },
          })
        }
      } catch (reDispatchError) {
        console.error('Error during auto re-dispatch:', reDispatchError)
      }
    }

    // 6. Return result
    const rawBooking = await firestoreDb.bookings.findUnique({ where: { id: bookingId } })
    let updatedBooking = null

    if (rawBooking) {
      const clientUser = await firestoreDb.clientUsers.findUnique({ where: { id: rawBooking.userId } })
      const pkg = await firestoreDb.packages.findUnique({ where: { id: rawBooking.packageId } })
      updatedBooking = {
        ...rawBooking,
        package: pkg,
        user: clientUser ? { id: clientUser.id, name: clientUser.name, email: clientUser.email, phone: clientUser.phone } : null,
      }
    }

    return NextResponse.json({
      booking: updatedBooking,
      reDispatched,
    })
  } catch (error) {
    console.error('Error declining booking:', error)
    return NextResponse.json(
      { error: 'Failed to decline booking' },
      { status: 500 }
    )
  }
}
