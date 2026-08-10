import { calculateHaversineDistance, calculateEtaMinutes, isGpsSpoofed } from '../src/utils/geo';

describe('Geospatial & ETA Utilities', () => {
  it('should calculate accurate Haversine distance between two coordinates', () => {
    // Distance between Bandra (19.0544, 72.8402) and Kurla (19.0728, 72.8826) ~ 4.8 km
    const dist = calculateHaversineDistance(19.0544, 72.8402, 19.0728, 72.8826);
    expect(dist).toBeGreaterThan(4.0);
    expect(dist).toBeLessThan(6.0);
  });

  it('should calculate ETA minutes correctly using standard formula', () => {
    // Formula: etaMinutes = Math.ceil((distanceKm / 25) * 60)
    // 25 km -> (25/25)*60 = 60 mins
    expect(calculateEtaMinutes(25)).toBe(60);
    // 12.5 km -> (12.5/25)*60 = 30 mins
    expect(calculateEtaMinutes(12.5)).toBe(30);
    // 1.2 km -> ceil((1.2/25)*60) = ceil(2.88) = 3 mins
    expect(calculateEtaMinutes(1.2)).toBe(3);
  });

  it('should detect GPS spoofing when distance jump exceeds 5km within 10s', () => {
    const prevTime = new Date('2026-08-10T10:00:00Z');
    const newTime = new Date('2026-08-10T10:00:05Z'); // 5 seconds later

    // 10 km jump in 5 seconds
    const spoofResult = isGpsSpoofed(
      19.076,
      72.8777,
      prevTime,
      19.16,
      72.95,
      newTime
    );

    expect(spoofResult.spoofed).toBe(true);
    expect(spoofResult.reason).toContain('Impossible speed/jump');
  });

  it('should pass normal realistic location movement', () => {
    const prevTime = new Date('2026-08-10T10:00:00Z');
    const newTime = new Date('2026-08-10T10:00:05Z'); // 5 seconds later

    // Small realistic movement (~50 meters)
    const spoofResult = isGpsSpoofed(
      19.076,
      72.8777,
      prevTime,
      19.0761,
      72.8778,
      newTime
    );

    expect(spoofResult.spoofed).toBe(false);
  });
});
