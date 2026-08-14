const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius || '5');

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng query params are required' });
    }

    const redis = req.redis;
    const results = await redis.geosearch(
      'partners:online',
      'FROMLONLAT',
      lng,
      lat,
      'BYRADIUS',
      radius,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      20
    );

    const partners = results.map(([id, dist]) => ({
      partnerId: id,
      distanceKm: Number(dist)
    }));

    res.json({ success: true, count: partners.length, partners });
  } catch (err) {
    console.error('Error in /partners/nearby:', err.message);
    res.status(500).json({ error: 'Failed to query nearby partners', details: err.message });
  }
});

module.exports = router;
