/**
  * Calculates Haversine distance between two sets of GPS coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates Estimated Time of Arrival (ETA) in minutes based on average speed (25 km/h)
 * Formula specified: etaMinutes = Math.ceil((distanceKm / 25) * 60);
 */
export function calculateEtaMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 1;
  const eta = Math.ceil((distanceKm / 25) * 60);
  return Math.max(1, eta);
}

/**
 * Basic GPS Spoofing Detection
 * Rules: Reject jumps > 5 km within 10 seconds.
 */
export function isGpsSpoofed(
  prevLat: number,
  prevLng: number,
  prevRecordedAt: Date,
  newLat: number,
  newLng: number,
  newRecordedAt: Date = new Date()
): { spoofed: boolean; reason?: string } {
  if (!prevLat || !prevLng || !prevRecordedAt) {
    return { spoofed: false };
  }

  const timeDiffSeconds = Math.abs(newRecordedAt.getTime() - prevRecordedAt.getTime()) / 1000;
  const distanceKm = calculateHaversineDistance(prevLat, prevLng, newLat, newLng);

  // If jump > 5km within 10 seconds, flag as spoofed
  if (timeDiffSeconds <= 10 && distanceKm > 5.0) {
    return {
      spoofed: true,
      reason: `Impossible speed/jump: ${distanceKm}km moved in ${timeDiffSeconds.toFixed(1)}s`,
    };
  }

  return { spoofed: false };
}
