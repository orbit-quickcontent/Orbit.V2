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

interface PartnerLocationBody {
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  heading?: number | string;
  speed?: number | string;
  accuracy?: number | string;
  timestamp?: number | string;
  timestampMs?: number | string;
}

const MAX_ACCURACY_METERS = Number(process.env.MAX_GPS_ACCURACY_METERS || 100);
const MAX_LOCATION_AGE_MS = Number(process.env.MAX_GPS_AGE_MS || 15000);
const MAX_FUTURE_SKEW_MS = Number(process.env.MAX_GPS_FUTURE_SKEW_MS || 10000);
const MAX_PLAUSIBLE_SPEED_MPS = Number(process.env.MAX_PLAUSIBLE_SPEED_MPS || 100);

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180)
    * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
    const body = await request.json().catch(() => null) as PartnerLocationBody | null;
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const lat = typeof body.lat === 'number' ? body.lat : parseFloat(String(body.lat ?? body.latitude ?? ''));
    const lng = typeof body.lng === 'number' ? body.lng : parseFloat(String(body.lng ?? body.longitude ?? ''));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Latitude (lat) and longitude (lng) are required and must be numbers' }, { status: 400 });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Latitude must be -90 to 90, longitude must be -180 to 180' }, { status: 422 });
    }

    const heading = body.heading !== undefined ? Number(body.heading) : undefined;
    const speed = body.speed !== undefined ? Number(body.speed) : undefined;
    const accuracy = body.accuracy !== undefined ? Number(body.accuracy) : undefined;
    const reportedTimestampRaw = body.timestampMs ?? body.timestamp;
    const reportedTimestamp = reportedTimestampRaw !== undefined ? Number(reportedTimestampRaw) : Date.now();

    if (heading !== undefined && (!Number.isFinite(heading) || heading < 0 || heading > 360)) {
      return NextResponse.json({ error: 'Heading must be between 0 and 360 degrees' }, { status: 422 });
    }
    if (speed !== undefined && (!Number.isFinite(speed) || speed < 0 || speed > MAX_PLAUSIBLE_SPEED_MPS)) {
      return NextResponse.json({ error: 'Reported GPS speed is implausible' }, { status: 422 });
    }
    if (accuracy !== undefined && (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > MAX_ACCURACY_METERS)) {
      return NextResponse.json({ error: `GPS accuracy must be at most ${MAX_ACCURACY_METERS} meters` }, { status: 422 });
    }
    if (!Number.isFinite(reportedTimestamp)) {
      return NextResponse.json({ error: 'Invalid GPS timestamp' }, { status: 422 });
    }

    const nowMs = Date.now();
    if (reportedTimestamp < nowMs - MAX_LOCATION_AGE_MS || reportedTimestamp > nowMs + MAX_FUTURE_SKEW_MS) {
      return NextResponse.json({ error: 'GPS timestamp is stale or outside the allowed clock skew' }, { status: 422 });
    }

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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    if (partner.latitude != null && partner.longitude != null && partner.lastLocationAt) {
      const previousMs = new Date(partner.lastLocationAt).getTime();
      const elapsedMs = Math.max(1000, reportedTimestamp - previousMs);
      const distanceMeters = haversineMeters(partner.latitude, partner.longitude, lat, lng);
      const derivedSpeed = distanceMeters / (elapsedMs / 1000);
      if (derivedSpeed > MAX_PLAUSIBLE_SPEED_MPS) {
        return NextResponse.json({ error: 'GPS movement between updates is implausible' }, { status: 422 });
      }
    }

    const partnerId = partner.id;
    const nowIso = new Date(reportedTimestamp).toISOString();

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
      accuracy: accuracy ?? null,
      timestamp: nowIso,
    });

    return NextResponse.json({
      message: 'Location updated successfully',
      partnerId,
      lat,
      lng,
      heading: heading ?? null,
      speed: speed ?? null,
      accuracy: accuracy ?? null,
      timestamp: nowIso,
    });
  } catch (error) {
    console.error('[PartnerLocation] Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export const POST = PATCH;
