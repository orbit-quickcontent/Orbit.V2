/**
 * Geo Service — Nearest-Partner Proximity Utilities
 *
 * Pure utility functions for geospatial calculations used by the
 * nearest-partner dispatch system. No Firestore / side effects.
 *
 * Exports:
 *  - haversineKm()            — great-circle distance between two GPS points
 *  - sortPartnersByProximity() — annotate + sort partners nearest-first
 *  - filterActivePartners()   — filter for online, recently-located partners
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PartnerGeoRecord {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  lastLocationAt?: string | Date | null;
  availability?: boolean;
  serviceRadiusKm?: number | null;
  [key: string]: any;
}

export interface PartnerWithDistance extends PartnerGeoRecord {
  distanceKm: number;
}

// ── Haversine Distance ────────────────────────────────────────────────────────

/**
 * Calculate the great-circle distance (km) between two GPS coordinates
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point A (degrees)
 * @param lng1 Longitude of point A (degrees)
 * @param lat2 Latitude of point B (degrees)
 * @param lng2 Longitude of point B (degrees)
 * @returns Distance in kilometres
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Proximity Sort ────────────────────────────────────────────────────────────

/**
 * Annotate a list of partner records with their distance from a booking
 * location and return the list sorted nearest-first.
 *
 * Partners without valid latitude/longitude are pushed to the end of the list
 * with a synthetic distance of Infinity.
 *
 * @param partners     Array of partner_profiles documents from Firestore
 * @param bookingLat   Booking pickup latitude
 * @param bookingLng   Booking pickup longitude
 * @returns New array with `distanceKm` added, sorted ascending by distance
 */
export function sortPartnersByProximity(
  partners: PartnerGeoRecord[],
  bookingLat: number,
  bookingLng: number
): PartnerWithDistance[] {
  return partners
    .map((partner) => {
      const hasCoords =
        partner.latitude != null && partner.longitude != null;
      const distanceKm = hasCoords
        ? haversineKm(bookingLat, bookingLng, partner.latitude!, partner.longitude!)
        : Infinity;
      return { ...partner, distanceKm };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── Active Partner Filter ─────────────────────────────────────────────────────

/**
 * Filter a list of partners to those that are:
 *  1. Marked as available (`availability === true`)
 *  2. Have reported their location within `maxStaleMinutes` (default: 10 min)
 *     — partners with no `lastLocationAt` are always included (new/legacy)
 *  3. (Optionally) present in the WebSocket `onlinePartnerIds` set
 *
 * @param partners         Array of partner_profiles documents
 * @param onlinePartnerIds Set of partnerIds with active WS connections (pass
 *                         `null` to skip WS-presence check)
 * @param maxStaleMinutes  Maximum age of last GPS update in minutes (default 10)
 * @returns Filtered array of active partners
 */
export function filterActivePartners(
  partners: PartnerGeoRecord[],
  onlinePartnerIds: Set<string> | null = null,
  maxStaleMinutes = 10
): PartnerGeoRecord[] {
  const now = Date.now();
  const maxStaleMs = maxStaleMinutes * 60 * 1000;

  return partners.filter((partner) => {
    // Must be marked available
    if (!partner.availability) return false;

    // Optionally require active WS connection
    if (onlinePartnerIds !== null && !onlinePartnerIds.has(partner.id)) {
      return false;
    }

    // Location freshness check (skip if no lastLocationAt — legacy partner)
    if (partner.lastLocationAt) {
      const lastSeen =
        partner.lastLocationAt instanceof Date
          ? partner.lastLocationAt.getTime()
          : new Date(partner.lastLocationAt as string).getTime();
      if (now - lastSeen > maxStaleMs) return false;
    }

    return true;
  });
}

// ── Nearest-N Helper ──────────────────────────────────────────────────────────

/**
 * Convenience wrapper: filter active partners, sort by proximity, return top N.
 *
 * @param partners         All partner_profiles documents
 * @param bookingLat       Booking pickup latitude (or null to skip sort)
 * @param bookingLng       Booking pickup longitude (or null to skip sort)
 * @param topN             How many partners to return (default: 5)
 * @param onlinePartnerIds Optional WS presence set for online-only filtering
 * @param maxStaleMinutes  Maximum location freshness in minutes (default: 10)
 */
export function findNearestPartners(
  partners: PartnerGeoRecord[],
  bookingLat: number | null,
  bookingLng: number | null,
  topN = 5,
  onlinePartnerIds: Set<string> | null = null,
  maxStaleMinutes = 10
): PartnerWithDistance[] {
  const active = filterActivePartners(partners, onlinePartnerIds, maxStaleMinutes);

  if (bookingLat != null && bookingLng != null) {
    return sortPartnersByProximity(active, bookingLat, bookingLng).slice(0, topN);
  }

  // No booking coordinates — return first topN available partners with Infinity distance
  return active.slice(0, topN).map((p) => ({ ...p, distanceKm: Infinity }));
}

export default {
  haversineKm,
  sortPartnersByProximity,
  filterActivePartners,
  findNearestPartners,
};
