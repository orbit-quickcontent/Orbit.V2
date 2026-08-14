const express = require('express');
const router = express.Router();
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // don't hang if redis is not running
});
redis.connect().catch(() => {
  console.warn('[Redis] Redis not available for nearby route. Using fallback in-memory or empty.');
});

// GET /partners/nearby?lat=&lng=&radius=
router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius || '5');

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
    }

    let partners = [];

    if (redis.status === 'ready') {
      try {
        // Redis GEOSEARCH (Redis 6.2+)
        const results = await redis.geosearch(
          'partners:online',
          'FROMLONLAT',
          lng,
          lat,
          'BYRADIUS',
          radius,
          'km',
          'WITHDIST',
          'WITHCOORD',
          'ASC',
          'COUNT',
          20
        );

        partners = await Promise.all(
          results.map(async ([id, dist, coords]) => {
            const rawDetails = await redis.get(`partner:${id}`);
            let details = {};
            if (rawDetails) {
              try { details = JSON.parse(rawDetails); } catch (_) {}
            }
            return {
              partnerId: id,
              distanceKm: parseFloat(Number(dist).toFixed(2)),
              lat: coords ? parseFloat(coords[1]) : details.lat || null,
              lng: coords ? parseFloat(coords[0]) : details.lng || null,
              speed: details.speed || 0,
              heading: details.heading || 0,
              lastSeen: details.ts || Date.now(),
            };
          })
        );
      } catch (redisErr) {
        console.warn('[Redis GeoSearch error]', redisErr.message);
      }
    }

    return res.json(partners);
  } catch (error) {
    console.error('[Nearby Route Error]', error);
    return res.status(500).json({ error: 'Internal Server Error fetching nearby partners' });
  }
});

module.exports = router;
