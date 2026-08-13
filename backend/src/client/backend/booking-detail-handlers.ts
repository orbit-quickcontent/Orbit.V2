import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '../../services/db.service'
import { generatePresignedUrl } from '@/lib/security'
import { verifyToken } from '@/lib/security-auth'
import { assertTransition } from '@/core/booking-state'
import { releasePartnerEarning } from '@/services/partner-earnings.service'
import { notifyClient } from '@/services/websocket.service'

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
  cancelledBy?: string
  masterReelUrl?: string
  hlsPlaylistUrl?: string
  proxyFootageUrl?: string
}

async function authorizeBooking(request: NextRequest, booking: { userId: string; partnerId: string | null }) {
  const raw = request.headers.get('authorization') || ''
  const session = verifyToken(raw)
  if (!session || session.type !== 'access') return { session: null, error: 'Unauthorized' }

  if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') return { session, error: null }
  if (session.role === 'CLIENT' && booking.userId === session.id) return { session, error: null }

  if (session.role === 'PARTNER') {
    const partner = await dbClient.partner.findUnique({ where: { userId: session.id }, select: { id: true } })
    if (partner && booking.partnerId === partner.id) return { session, error: null }
  }

  return { session: null, error: 'Booking access denied' }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const booking = await dbClient.booking.findUnique({
      where: { id },
      include: { user: true, package: true, partner: { include: { user: true } } },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const auth = await authorizeBooking(request, booking)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 403 })

    return NextResponse.json({
      booking: {
        ...booking,
        reelUrl: booking.masterReelUrl ? generatePresignedUrl(booking.masterReelUrl) : null,
        masterReelUrl: booking.masterReelUrl ? generatePresignedUrl(booking.masterReelUrl) : null,
        hlsPlaylistUrl: booking.hlsPlaylistUrl ? generatePresignedUrl(booking.hlsPlaylistUrl) : null,
      },
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateBookingBody = await request.json()
    const existing = await dbClient.booking.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const auth = await authorizeBooking(request, existing)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 403 })

    if (body.partnerId !== undefined) {
      return NextResponse.json({ error: 'Partner assignment is only permitted through partner acceptance' }, { status: 403 })
    }
    if (body.paymentStatus !== undefined) {
      return NextResponse.json({ error: 'Payment state is managed by Razorpay order/webhook flow' }, { status: 403 })
    }

    if (body.status && body.status !== existing.status) {
      if (body.status === 'CANCELLED') {
        if (!['PENDING', 'PAID', 'DISPATCHED', 'EN_ROUTE', 'SHOOTING', 'SYNCING', 'EDITING'].includes(existing.status)) {
          return NextResponse.json({ error: `Booking cannot be cancelled from ${existing.status}` }, { status: 409 })
        }
      } else {
        try {
          assertTransition(existing.status, body.status)
        } catch (transitionError) {
          return NextResponse.json({ error: (transitionError as Error).message }, { status: 409 })
        }
      }
    }

    if (body.status === 'CANCELLED') {
      await dbClient.$transaction(async (tx) => {
        await tx.workDispatch.updateMany({
          where: { bookingId: id, status: 'PENDING' },
          data: { status: 'CANCELLED', respondedAt: new Date() },
        })
        await tx.booking.update({
          where: { id },
          data: { status: 'CANCELLED', cancelledBy: body.cancelledBy || auth.session?.role || 'CLIENT' },
        })
      })
      notifyClient({ bookingId: id, event: 'booking:status-update', data: { bookingId: id, status: 'CANCELLED', previousStatus: existing.status } })
      return NextResponse.json({ booking: await dbClient.booking.findUnique({ where: { id } }) })
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.syncPercentage !== undefined) updateData.syncPercentage = body.syncPercentage
    if (body.editCountdown !== undefined) updateData.editCountdown = body.editCountdown
    if (body.location !== undefined) updateData.location = body.location
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.timeSlot !== undefined) updateData.timeSlot = body.timeSlot
    if (body.bookingDate !== undefined) updateData.bookingDate = new Date(body.bookingDate)
    if (body.masterReelUrl !== undefined) updateData.masterReelUrl = body.masterReelUrl
    if (body.hlsPlaylistUrl !== undefined) updateData.hlsPlaylistUrl = body.hlsPlaylistUrl
    if (body.proxyFootageUrl !== undefined) updateData.proxyFootageUrl = body.proxyFootageUrl
    if (body.status === 'DELIVERED') updateData.deliveredAt = new Date()

    const updatedRaw = await dbClient.booking.update({ where: { id }, data: updateData })

    if (body.status === 'DELIVERED' && existing.status !== 'DELIVERED') {
      await releasePartnerEarning(id)
    }

    if (body.status !== undefined && body.status !== existing.status) {
      notifyClient({
        bookingId: id,
        event: 'booking:status-update',
        data: {
          bookingId: id,
          status: updatedRaw.status,
          previousStatus: existing.status,
          reelUrl: updatedRaw.masterReelUrl || null,
          deliveredAt: updatedRaw.deliveredAt || null,
        },
      })
    }

    if (body.syncPercentage !== undefined && body.syncPercentage !== existing.syncPercentage) {
      notifyClient({ bookingId: id, event: 'booking:sync-update', data: { bookingId: id, syncPercentage: updatedRaw.syncPercentage } })
    }

    if (body.editCountdown !== undefined && body.editCountdown !== existing.editCountdown) {
      notifyClient({ bookingId: id, event: 'booking:countdown-update', data: { bookingId: id, editCountdown: updatedRaw.editCountdown } })
    }

    return NextResponse.json({ booking: updatedRaw })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
