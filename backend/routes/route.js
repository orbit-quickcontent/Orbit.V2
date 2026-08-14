const express = require('express');
const router = express.Router();

// Simple in-memory cache to respect public OSRM demo rate limits
const routeCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

// Helper for HTTP requests using native fetch (Node 18+) or https fallback
async function fetchJson(url, timeoutMs = 4000) {
  if (typeof fetch === 'function') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // Fallback to https module
  const https = require('https');
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', reject);
  });
}

// GET /route?fromLat=&fromLng=&toLat=&toLng=
router.get('/', async (req, res) => {
  try {
    const fromLat = parseFloat(req.query.fromLat);
    const fromLng = parseFloat(req.query.fromLng);
    const toLat = parseFloat(req.query.toLat);
    const toLng = parseFloat(req.query.toLng);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      return res.status(400).json({ error: 'Valid fromLat, fromLng, toLat, and toLng query parameters are required.' });
    }

    const cacheKey = `${fromLat.toFixed(4)},${fromLng.toFixed(4)}_${toLat.toFixed(4)},${toLng.toFixed(4)}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    let responseData = null;
    try {
      const data = await fetchJson(osrmUrl, 4000);
      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        responseData = {
          success: true,
          distanceMeters: Math.round(route.distance),
          distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
          durationSeconds: Math.round(route.duration),
          etaMinutes: Math.max(1, Math.ceil(route.duration / 60)),
          geometry: route.geometry,
        };
      }
    } catch (osrmErr) {
      console.warn('[OSRM API notice / fallback]', osrmErr.message);
    }

    // Fallback calculation via Haversine
    if (!responseData) {
      const R = 6371; // km
      const dLat = ((toLat - fromLat) * Math.PI) / 180;
      const dLng = ((toLng - fromLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((fromLat * Math.PI) / 180) *
          Math.cos((toLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;
      const estSpeedKmH = 25; // average urban driving speed
      const durationSec = Math.round((distKm / estSpeedKmH) * 3600);

      responseData = {
        success: true,
        fallback: true,
        distanceMeters: Math.round(distKm * 1000),
        distanceKm: parseFloat(distKm.toFixed(2)),
        durationSeconds: durationSec,
        etaMinutes: Math.max(1, Math.ceil(durationSec / 60)),
        geometry: {
          type: 'LineString',
          coordinates: [
            [fromLng, fromLat],
            [toLng, toLat],
          ],
        },
      };
    }

    routeCache.set(cacheKey, { ts: Date.now(), data: responseData });
    return res.json(responseData);
  } catch (error) {
    console.error('[Route API Error]', error);
    return res.status(500).json({ error: 'Internal Server Error calculating route' });
  }
});

module.exports = router;
