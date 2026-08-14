const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const fromLat = parseFloat(req.query.fromLat);
    const fromLng = parseFloat(req.query.fromLng);
    const toLat = parseFloat(req.query.toLat);
    const toLng = parseFloat(req.query.toLng);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      return res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng are required' });
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const response = await axios.get(url, { timeout: 5000 });
    const route = response.data.routes[0];

    if (!route) {
      return res.status(404).json({ error: 'No route found' });
    }

    res.json({
      success: true,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      estimatedMinutes: Math.round(route.duration / 60),
      geometry: route.geometry
    });
  } catch (err) {
    console.error('Error in /route (OSRM):', err.message);
    // Haversine fallback if OSRM is unreachable
    const fromLat = parseFloat(req.query.fromLat);
    const fromLng = parseFloat(req.query.fromLng);
    const toLat = parseFloat(req.query.toLat);
    const toLng = parseFloat(req.query.toLng);

    const R = 6371e3; // meters
    const φ1 = fromLat * Math.PI / 180;
    const φ2 = toLat * Math.PI / 180;
    const Δφ = (toLat - fromLat) * Math.PI / 180;
    const Δλ = (toLng - fromLng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distMeters = R * c;

    res.json({
      success: true,
      fallback: true,
      distanceMeters: Math.round(distMeters),
      durationSeconds: Math.round(distMeters / 8.33), // ~30 km/h avg speed
      estimatedMinutes: Math.round((distMeters / 8.33) / 60),
      geometry: {
        type: 'LineString',
        coordinates: [[fromLng, fromLat], [toLng, toLat]]
      }
    });
  }
});

module.exports = router;
