import { PrismaClient, PartnerStatus } from '@prisma/client';
import { addPartnerToGeoSet, findNearbyPartnerIds, redis } from '../config/redis';
import { calculateHaversineDistance, calculateEtaMinutes, isGpsSpoofed } from '../utils/geo';
import { broadcastPartnerLocationUpdate } from './socketService';

const prisma = new PrismaClient();

export interface LocationInput {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

export interface NearbyPartnerResponse {
  partnerId: string;
  name: string;
  phone?: string;
  vehicleType?: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  etaMinutes: number;
  rating: number;
  status: PartnerStatus;
}

export async function processPartnerLocationUpdate(
  partnerId: string,
  input: LocationInput
): Promise<{ success: boolean; spoofed?: boolean; partner?: any }> {
  const { latitude, longitude, speed = 0, heading = 0 } = input;
  const now = new Date();

  // 1. Fetch current partner state from DB or Redis cache
  const existingPartner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!existingPartner) {
    throw new Error('Partner not found');
  }

  // 2. Perform GPS Anti-Spoofing check against previous position
  if (existingPartner.latitude && existingPartner.longitude) {
    const spoofCheck = isGpsSpoofed(
      existingPartner.latitude,
      existingPartner.longitude,
      existingPartner.lastSeenAt,
      latitude,
      longitude,
      now
    );

    if (spoofCheck.spoofed) {
      console.warn(`[GPS_SPOOF_DETECTED] Partner ${partnerId}: ${spoofCheck.reason}`);
      return { success: false, spoofed: true };
    }
  }

  // 3. Determine target status (if OFFLINE, elevate to ONLINE)
  const newStatus =
    existingPartner.status === PartnerStatus.OFFLINE
      ? PartnerStatus.ONLINE
      : existingPartner.status;

  // 4. Update Postgres Partner row
  const updatedPartner = await prisma.partner.update({
    where: { id: partnerId },
    data: {
      latitude,
      longitude,
      lastSeenAt: now,
      status: newStatus,
    },
  });

  // 5. Append to LocationHistory table
  await prisma.locationHistory.create({
    data: {
      partnerId,
      latitude,
      longitude,
      speed,
      heading,
      recordedAt: now,
    },
  });

  // 6. Redis GEO set update (only if ONLINE or BUSY)
  if (newStatus === PartnerStatus.ONLINE || newStatus === PartnerStatus.BUSY) {
    await addPartnerToGeoSet(partnerId, latitude, longitude);
  }

  // 7. Store latest snapshot in Redis key partner:location:<id>
  await redis.set(
    `partner:location:${partnerId}`,
    JSON.stringify({
      partnerId,
      latitude,
      longitude,
      speed,
      heading,
      status: newStatus,
      updatedAt: now.toISOString(),
    }),
    'EX',
    300
  );

  // 8. Publish update via Socket.IO
  broadcastPartnerLocationUpdate({
    partnerId,
    latitude,
    longitude,
    speed,
    heading,
    status: newStatus,
  });

  return { success: true, partner: updatedPartner };
}

export async function findNearbyPartnersSortedByEta(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<NearbyPartnerResponse[]> {
  // 1. Search Redis GEO index
  const geoResults = await findNearbyPartnerIds(latitude, longitude, radiusKm);

  if (!geoResults || geoResults.length === 0) {
    return [];
  }

  const partnerIds = geoResults.map((r) => r.partnerId);

  // 2. Fetch Partner metadata from database
  const partners = await prisma.partner.findMany({
    where: {
      id: { in: partnerIds },
      status: PartnerStatus.ONLINE, // Only available ONLINE partners
    },
  });

  const geoMap = new Map(geoResults.map((g) => [g.partnerId, g.distanceKm]));

  // 3. Compute ETA and format response
  const results: NearbyPartnerResponse[] = partners.map((p) => {
    // Exact distance recalculation from user location or use redis dist
    const dist =
      geoMap.get(p.id) ?? calculateHaversineDistance(latitude, longitude, p.latitude, p.longitude);
    const eta = calculateEtaMinutes(dist);

    return {
      partnerId: p.id,
      name: p.name,
      phone: p.phone,
      vehicleType: p.vehicleType,
      latitude: p.latitude,
      longitude: p.longitude,
      distanceKm: dist,
      etaMinutes: eta,
      rating: p.rating,
      status: p.status,
    };
  });

  // 4. Sort by ETA ascending
  return results.sort((a, b) => a.etaMinutes - b.etaMinutes);
}
