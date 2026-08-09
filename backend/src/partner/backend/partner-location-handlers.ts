import { NextRequest, NextResponse } from 'next/server'
import { firestoreDb } from '../../lib/db'
import { verifyToken } from '../../lib/security-auth'

/**
 * POST /api/partner/location
 * Called every 5 seconds by the partner app while online.
 * Updates partner's live GPS in Firestore + basic GPS spoof detection.
 */
export async function updatePartnerLocationHandler(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const decoded = verifyToken(token)
    if (!decoded?.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const { latitude, longitude, speed = 0, heading = 0 } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'latitude and longitude are required numbers' }, { status: 400 })
    }

    // Basic GPS spoof detection — reject jumps > 5km in < 10s
    let partner = await firestoreDb.partners.findUnique({ where: { userId: decoded.sub } })
    if (!partner) {
      partner = await firestoreDb.partners.findUnique({ where: { id: decoded.sub } })
    }

    if (partner?.latitude && partner?.longitude) {
      const distKm = haversineKm(partner.latitude, partner.longitude, latitude, longitude)
      const lastUpdate = partner.lastSeenAt ? new Date(partner.lastSeenAt).getTime() : 0
      const secondsSinceLast = (Date.now() - lastUpdate) / 1000
      if (distKm > 5 && secondsSinceLast < 10) {
        return NextResponse.json(
          { error: 'GPS location jump detected — possible spoof', distKm, secondsSinceLast },
          { status: 422 }
        )
      }
    }

    // Resolve partner profile id
    const partnerId = partner?.id || decoded.sub

    // Update live location in Firestore
    await firestoreDb.partners.update({
      where: { id: partnerId },
      data: {
        latitude,
        longitude,
        lastSeenAt: new Date().toISOString(),
        availability: true, // going online implicitly
      },
    })

    // Log to location history (keep last 100 entries per partner)
    try {
      await firestoreDb.locationHistory?.create?.({
        data: {
          partnerId,
          latitude,
          longitude,
          speed,
          heading,
          recordedAt: new Date().toISOString(),
        },
      })
    } catch {
      // location_history collection optional — skip if not configured
    }

    // Count how many open bookings are within 10km of this partner
    let nearbyBookings = 0
    try {
      const openBookings = await firestoreDb.bookings.findMany({
        where: { status: 'PENDING' },
      })
      nearbyBookings = openBookings.filter((b: any) => {
        if (!b.clientLatitude || !b.clientLongitude) return true // include if no coords stored
        return haversineKm(latitude, longitude, b.clientLatitude, b.clientLongitude) <= 10
      }).length
    } catch {
      // best-effort
    }

    return NextResponse.json({ success: true, nearbyBookings })
  } catch (err) {
    console.error('[PartnerLocation]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Haversine distance formula
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function toRad(deg: number) { return (deg * Math.PI) / 180 }

// Next.js-compatible export for nextToExpress adapter
export const POST = updatePartnerLocationHandler
