/**
 * Vitest — Redis GEO Nearby Partner Dispatch & Lock Tests
 */

import { describe, it, expect } from "vitest";
import { findNearestPartners, haversineKm } from "../src/services/geo.service";

describe("Redis GEO Nearby Partner Dispatching", () => {
  it("should calculate Haversine distance between coordinates accurately", () => {
    // Connaught Place to India Gate (~2.5km)
    const distance = haversineKm(28.6315, 77.2167, 28.6129, 77.2295);
    expect(distance).toBeGreaterThan(1.5);
    expect(distance).toBeLessThan(3.5);
  });

  it("should rank nearby partner candidates by ascending distance", () => {
    const mockPartners = [
      { id: "p1", name: "Far Partner", latitude: 28.7041, longitude: 77.1025, availability: true },
      { id: "p2", name: "Near Partner", latitude: 28.6320, longitude: 77.2170, availability: true },
    ];

    const ranked = findNearestPartners(mockPartners, 28.6315, 77.2167, 5, null, 20);
    expect(ranked.length).toBe(2);
    expect(ranked[0].id).toBe("p2");
    expect(ranked[1].id).toBe("p1");
  });
});
