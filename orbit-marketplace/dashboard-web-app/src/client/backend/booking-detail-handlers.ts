/**
 * Client Backend | Booking Detail Handlers
 *
 * Individual booking business logic using Firestore:
 * - GET   — Get booking with full details (user, package, partner)
 * - PATCH — Update booking (status, payment, sync, partner assignment)
 *           Includes wallet crediting on DELIVERED and re-dispatch on PARTNER cancel
 *
 * Re-exported by: src/app/api/bookings/[id]/route.ts
 */

import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface UpdateBookingBody {
  status?: string
  paymentStatus?: string
  syncPercentage?: number
  editCountdown?: number | null
  partnerId?: string | null
  location?: string
  notes?: string
  timeSlot?: string
  bookingDate?: string
  cancelledBy?: string // CLIENT or PARTNER
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await firestoreDb.bookings.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const user = await firestoreDb.clientUsers.findUnique({
      where: { id: booking.userId },
    })

    const pkg = await firestoreDb.packages.findUnique({
      where: { id: booking.packageId },
    })

    let partner = null
    if (booking.partnerId) {
      const partnerData = await firestoreDb.partners.findUnique({
        where: { id: booking.partnerId },
      })
      if (partnerData) {
        const partnerUser = await firestoreDb.partnerUsers.findUnique({
          where: { id: partnerData.userId },
        })
        partner = {
          ...partnerData,
          user: partnerUser ? {
            id: partnerUser.id,
            name: partnerUser.name,
            phone: partnerUser.phone,
            avatar: partnerUser.avatar,
          } : null,
        }
      }
    }

    const bookingWithDetails = {
      ...booking,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location || null,
        brandLogo: user.brandLogo || null,
        brandFont: user.brandFont || null,
        brandColor: user.brandColor || null,
        editorRequirements: user.editorRequirements || null,
        avatar: user.avatar || null,
      } : null,
      package: pkg,
      partner,
    }

    return NextResponse.json({ booking: bookingWithDetails })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateBookingBody = await request.json()

    // Verify booking exists with package info
    const existing = await firestoreDb.bookings.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const pkg = await firestoreDb.packages.findUnique({
      where: { id: existing.packageId },
    })

    // ── Handle PARTNER cancellation with re-dispatch ──
    if (body.status === 'CANCELLED' && body.cancelledBy === 'PARTNER') {
      const cancelledPartnerId = existing.partnerId

      await firestoreDb.bookings.update({
        where: { id },
        data: {
          cancelledBy: 'PARTNER',
          partnerId: null,
          status: 'PAID',
        },
      })

      // Cancel any PENDING work dispatches for this booking
      await firestoreDb.workDispatches.updateMany({
        where: {
          bookingId: id,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
          respondedAt: new Date().toISOString(),
        },
      })

      // Auto-trigger dispatch to 5 new partners
      try {
        let declinedBy: string[] = []
        if (existing.declinedBy) {
          try {
            declinedBy = typeof existing.declinedBy === 'string' ? JSON.parse(existing.declinedBy) : (existing.declinedBy || [])
          } catch {
            declinedBy = []
          }
        }
        if (cancelledPartnerId && !declinedBy.includes(cancelledPartnerId)) {
          declinedBy.push(cancelledPartnerId)
        }

        const onlinePartners = await firestoreDb.partners.findMany({
          where: { availability: true },
        })

        // Filter out already declined/cancelled partners in-memory
        const availablePartners = onlinePartners.filter(p => !declinedBy.includes(p.id))

        if (availablePartners.length > 0) {
          const newRound = (existing.dispatchRound || 0) + 1
          const partnersToDispatch = availablePartners.slice(0, 5)

          await Promise.all(
            partnersToDispatch.map((partner) =>
              firestoreDb.workDispatches.create({
                data: {
                  bookingId: id,
                  partnerId: partner.id,
                  status: 'PENDING',
                  round: newRound,
                },
              })
            )
          )

          await firestoreDb.bookings.update({
            where: { id },
            data: {
              dispatchRound: newRound,
              status: 'PARTNER_DISPATCHED',
              declinedBy: JSON.stringify(declinedBy),
            },
          })

          // Notify WebSocket
          const partnerIds = partnersToDispatch.map((p) => p.id)
          try {
            await fetch('http://localhost:3003/internal/dispatch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: id,
                partnerIds,
                round: newRound,
              }),
            })
          } catch (wsError) {
            console.error('Failed to notify WebSocket for re-dispatch:', wsError)
          }
        }
      } catch (reDispatchError) {
        console.error('Error during auto re-dispatch after cancellation:', reDispatchError)
      }

      const rawBooking = await firestoreDb.bookings.findUnique({ where: { id } })
      const clientUser = rawBooking ? await firestoreDb.clientUsers.findUnique({ where: { id: rawBooking.userId } }) : null

      let partnerInfo = null
      if (rawBooking?.partnerId) {
        const pData = await firestoreDb.partners.findUnique({ where: { id: rawBooking.partnerId } })
        if (pData) {
          const pUser = await firestoreDb.partnerUsers.findUnique({ where: { id: pData.userId } })
          partnerInfo = {
            ...pData,
            user: pUser ? { id: pUser.id, name: pUser.name, phone: pUser.phone } : null,
          }
        }
      }

      const reDispatchedBooking = rawBooking ? {
        ...rawBooking,
        user: clientUser ? { id: clientUser.id, name: clientUser.name, email: clientUser.email, phone: clientUser.phone } : null,
        package: pkg,
        partner: partnerInfo,
      } : null

      return NextResponse.json({ booking: reDispatchedBooking, reDispatched: true })
    }

    // ── Build normal update data object ──
    const updateData: Record<string, unknown> = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
    if (body.syncPercentage !== undefined) updateData.syncPercentage = body.syncPercentage
    if (body.editCountdown !== undefined) updateData.editCountdown = body.editCountdown
    if (body.partnerId !== undefined) updateData.partnerId = body.partnerId
    if (body.location !== undefined) updateData.location = body.location
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.timeSlot !== undefined) updateData.timeSlot = body.timeSlot
    if (body.bookingDate !== undefined) updateData.bookingDate = new Date(body.bookingDate).toISOString()
    if (body.cancelledBy !== undefined) updateData.cancelledBy = body.cancelledBy

    if (body.status === 'DELIVERED') {
      updateData.deliveredAt = new Date().toISOString()
    }

    const updatedRaw = await firestoreDb.bookings.update({
      where: { id },
      data: updateData,
    })

    const clientUser = await firestoreDb.clientUsers.findUnique({
      where: { id: updatedRaw.userId },
    })

    let partner = null
    if (updatedRaw.partnerId) {
      const partnerData = await firestoreDb.partners.findUnique({
        where: { id: updatedRaw.partnerId },
      })
      if (partnerData) {
        const partnerUser = await firestoreDb.partnerUsers.findUnique({
          where: { id: partnerData.userId },
        })
        partner = {
          ...partnerData,
          user: partnerUser ? {
            id: partnerUser.id,
            name: partnerUser.name,
            phone: partnerUser.phone,
          } : null,
        }
      }
    }

    const booking = {
      ...updatedRaw,
      user: clientUser ? {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        phone: clientUser.phone,
      } : null,
      package: pkg,
      partner,
    }

    // Notify client via WebSocket server
    if (body.status !== undefined && body.status !== existing.status) {
      try {
        await fetch('http://localhost:3003/internal/notify-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: id,
            event: 'booking:status-update',
            payload: {
              bookingId: id,
              status: booking.status,
              previousStatus: existing.status,
            },
          }),
        })
      } catch (wsError) {
        console.error('Failed to notify WebSocket of status update:', wsError)
      }
    }

    if (body.syncPercentage !== undefined && body.syncPercentage !== existing.syncPercentage) {
      try {
        await fetch('http://localhost:3003/internal/notify-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: id,
            event: 'booking:sync-update',
            payload: {
              bookingId: id,
              syncPercentage: booking.syncPercentage,
            },
          }),
        })
      } catch (wsError) {
        console.error('Failed to notify WebSocket of sync update:', wsError)
      }
    }

    if (body.editCountdown !== undefined && body.editCountdown !== existing.editCountdown) {
      try {
        await fetch('http://localhost:3003/internal/notify-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: id,
            event: 'booking:countdown-update',
            payload: {
              bookingId: id,
              editCountdown: booking.editCountdown,
            },
          }),
        })
      } catch (wsError) {
        console.error('Failed to notify WebSocket of countdown update:', wsError)
      }
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}
