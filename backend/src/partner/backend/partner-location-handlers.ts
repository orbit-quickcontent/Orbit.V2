/**
 * Partner Backend | Partner Live-Location Handlers
 *
 * PATCH /partners/me/location
 *
 * Allows an authenticated partner to push their current GPS coordinates.
 * Simultaneously:
 *  1. Persists lat/lng + lastLocationAt to their `partner_profiles` Firestore doc
 *  2. Updates the in-memory LocationService singleton
 *  3. Broadcasts a `partner:location` event via Socket.IO so the dashboard
 *     map updates in real time
 *
 * Auth: requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"])
 * Body: { lat: number, lng: number, heading?: number, speed?: number }
 *
 * Re-exported by: src/routes/api.router.ts
 * Category: Partner Backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { firestoreDb } from '../../lib/db';
import { LocationService } from '../../services/location.service';
import { getIo } from '../../services/websocket.service';
import { verifyToken } from '../../lib/security-auth';

// ── PATCH /partners/me/location ───────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    let sessionUser: any = null;

    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload) {
        sessionUser = { id: (payload as any).sub || payload.id, email: payload.email, name: payload.name ?? '', role: payload.role };
      }
    }

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = sessionUser.id;

    // 2. Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const lat = typeof body.lat === 'number' ? body.lat : parseFloat(body.lat || body.latitude);
    const lng = typeof body.lng === 'number' ? body.lng : parseFloat(body.lng || body.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Latitude (lat) and longitude (lng) are required and must be numbers' },
        { status: 400 }
      );
    }

    // Sanity-check GPS range
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Latitude must be -90 to 90, longitude must be -180 to 180' },
        { status: 422 }
      );
    }

    const heading =
      body.heading !== undefined ? parseFloat(body.heading) : undefined;
    const speed =
      body.speed !== undefined ? parseFloat(body.speed) : undefined;

    // 3. Resolve the partner_profile document for this user
    let partner = await firestoreDb.partners.findUnique({ where: { userId } });
    if (!partner) {
      partner = await firestoreDb.partners.findUnique({ where: { id: userId } });
    }

    if (!partner) {
      // Auto-create profile on first location push (new partner just registered)
      const nowIso = new Date().toISOString();
      partner = await firestoreDb.partners.create({
        data: {
          userId,
          location: 'Location Pending',
          availability: true,
          isVerified: false,
          rating: 5.0,
          completedProjects: 0,
          walletBalance: 0.0,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      });
    }

    const partnerId = partner.id;
    const lastLocationAt = new Date().toISOString();

    // 4. Persist to Firestore
    await firestoreDb.partners.update({
      where: { id: partnerId },
      data: {
        latitude: lat,
        longitude: lng,
        lastSeenAt: lastLocationAt,
        lastLocationAt,
        availability: true,
      },
    });

    // 5. Update in-memory LocationService singleton
    const locationService = LocationService.getInstance();
    locationService.updateLocation(partnerId, lat, lng, heading, speed);

    // 6. Broadcast real-time location to dashboard / subscribed clients via WS
    const io = getIo();
    if (io) {
      io.emit('partner:location', {
        partnerId,
        userId,
        lat,
        lng,
        heading: heading ?? null,
        speed: speed ?? null,
        timestamp: lastLocationAt,
      });
    }

    return NextResponse.json({
      message: 'Location updated successfully',
      partnerId,
      lat,
      lng,
      heading: heading ?? null,
      speed: speed ?? null,
      timestamp: lastLocationAt,
    });
  } catch (error) {
    console.error('[PartnerLocation] Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export const POST = PATCH;

