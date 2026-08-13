/**
 * Partner Backend | Available Bookings Handlers
 *
 * Get all available dispatched bookings for a partner.
 * Partner earnings are included in the offer before acceptance.
 */
import { firestoreDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')
    if (!partnerId) return NextResponse.json({ error: 'partnerId query parameter is required' }, { status: 400 })

    let partner = await firestoreDb.partners.findUnique({ where: { id: partnerId } })
    if (!partner) partner = await firestoreDb.partners.findUnique({ where: { userId: partnerId } })

    if (!partner) {
      try {
        const partnerUser = await firestoreDb.partnerUsers.findUnique({ where: { id: partnerId } })
        partner = await firestoreDb.partners.create({
          data: {
            id: `prt-${partnerId}`,
            userId: partnerId,
            location: 'Mumbai, IN',
            latitude: 19.076,
            longitude: 72.877,
            availability: true,
            isVerified: false,
            rating: 5.0,
            completedProjects: 0,
            deviceInfo: 'Android',
            walletBalance: 0,
            displayName: partnerUser?.name || 'Orbit Partner',
          }
        })
      } catch (createErr) {
        console.warn('[AvailableBookings] Could not auto-create partner profile:', createErr)
        return NextResponse.json({ availableBookings: [] })
      }
    }

    const pendingDispatches = await firestoreDb.workDispatches.findMany({
      where: { partnerId: partner.id, status: 'PENDING' },
    })

    pendingDispatches.sort((a, b) => {
      const dateA = a.dispatchedAt ? new Date(a.dispatchedAt).getTime() : 0
      const dateB = b.dispatchedAt ? new Date(b.dispatchedAt).getTime() : 0
      return dateB - dateA
    })

    const availableBookings = await Promise.all(
      pendingDispatches.map(async (dispatch) => {
        const booking = await firestoreDb.bookings.findUnique({ where: { id: dispatch.bookingId } })
        if (!booking || booking.status === 'CANCELLED') return null

        const pkg = await firestoreDb.packages.findUnique({ where: { id: booking.packageId } })
        const user = await firestoreDb.clientUsers.findUnique({ where: { id: booking.userId } })
        const partnerEarningAmount = Number((booking as any).partnerEarningAmount ?? (pkg as any)?.partnerPayoutAmount ?? 700)

        return {
          dispatchId: dispatch.id,
          round: dispatch.round,
          dispatchedAt: dispatch.dispatchedAt,
          expiresAt: dispatch.expiresAt,
          earningAmount: partnerEarningAmount,
          partnerEarningAmount,
          currency: 'INR',
          payoutStatus: 'PENDING',
          booking: {
            ...booking,
            clientLatitude: (booking as any).lat != null ? Number((booking as any).lat) : (booking as any).latitude != null ? Number((booking as any).latitude) : null,
            clientLongitude: (booking as any).lng != null ? Number((booking as any).lng) : (booking as any).longitude != null ? Number((booking as any).longitude) : null,
            clientName: user?.name || 'Creative Client',
            clientPhone: user?.phone || null,
            packageName: pkg?.name || 'UGC Brand Reel Shoot',
            packagePrice: pkg?.price || 1500,
            distanceKm: dispatch.distanceKm != null ? Number(dispatch.distanceKm) : null,
            partnerEarningAmount,
            earningAmount: partnerEarningAmount,
            currency: 'INR',
            payoutStatus: 'PENDING',
            package: pkg,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              brandLogo: user.brandLogo || null,
              brandFont: user.brandFont || null,
              brandColor: user.brandColor || null,
              editorRequirements: user.editorRequirements || null,
              avatar: user.avatar || null,
            } : null,
          },
        }
      })
    )

    return NextResponse.json({ availableBookings: availableBookings.filter(Boolean) })
  } catch (error) {
    console.error('Error fetching available bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch available bookings' }, { status: 500 })
  }
}
