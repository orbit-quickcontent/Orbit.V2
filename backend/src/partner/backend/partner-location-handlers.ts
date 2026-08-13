/**
 * Partner Backend | Partner Live-Location Handlers
 *
 * PATCH /partners/me/location
 *
 * Persists the authenticated partner's coordinates and updates the Redis GEO
 * index used by the production dispatch engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { firestoreDb } from '../../lib/db';
import { LocationService } from '../../services/location.service';
import { getIo } from '../../services/websocket.service';
import { verifyToken } from '../../lib/security-auth';
import { setPartnerPresence } from '../../services/redis.service';

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(authHeader);
    if (!payload || payload.type !== 'access' || payload.role !== 'PARTNER') {
      return NextResponse.json({ error: 'Partner authentication required' }, { status: 403 });
    }

    const userId = payload.id;
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const lat = typeof body.lat === 'number' ? body.lat : parseFloat(body.lat ?? body.latitude);
    const lng = typeof body.lng === 'number' ? body.lng : parseFloat(body.lng ?? body.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Latitude (lat) and longitude (lng) are required and must be numbers' }, { status: 400 });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Latitude must be -90 to 90, longitude must be -180 to 180' }, { status: 422 });
    }

    const heading = body.heading !== undefined ? Number(body.heading) : undefined;
    const speed = body.speed !== undefined ? Number(body.speed) : undefined;
    const nowIso = new Date().toISOString();

    let partner = await firestoreDb.partners.findUnique({ where: { userId } });
    if (!partner) {
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

    await firestoreDb.partners.update({
      where: { id: partnerId },
      data: {
        latitude: lat,
        longitude: lng,
        lastSeenAt: nowIso,
        lastLocationAt: nowIso,
        availability: true,
      },
    });

    await setPartnerPresence(partnerId, lat, lng);

    const locationService = LocationService.getInstance();
    locationService.updateLocation(partnerId, lat, lng, heading, speed);

    const io = getIo();
    io?.emit('partner:location', {
      partnerId,
      userId,
      lat,
      lng,
      heading: heading ?? null,
      speed: speed ?? null,
      timestamp: nowIso,
    });

    return NextResponse.json({
      message: 'Location updated successfully',
      partnerId,
      lat,
      lng,
      heading: heading ?? null,
      speed: speed ?? null,
      timestamp: nowIso,
    });
  } catch (error) {
    console.error('[PartnerLocation] Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export const POST = PATCH;
