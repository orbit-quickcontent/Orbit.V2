import { Router, Request, Response } from 'express';
import { redis, KEYS } from '../redis';
import { onlinePartnerSockets } from '../socket';
import { activeBookingsMap } from '../dispatch';

const router = Router();

// GET / or HEAD / - Cloud deployment health check probe
router.all('/', async (_req: Request, res: Response) => {
  return res.status(200).json({
    name: 'ORBIT Dispatch Service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// GET /health - Server health & Redis ping
router.get('/health', async (_req: Request, res: Response) => {
  let redisStatus = 'UNKNOWN';
  try {
    const pingRes = await redis.ping();
    redisStatus = pingRes === 'PONG' ? 'UP' : 'DEGRADED';
  } catch (err) {
    redisStatus = 'DOWN';
  }

  const memoryUsage = process.memoryUsage();

  return res.json({
    status: redisStatus === 'UP' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    redis: redisStatus,
    activeSocketConnections: onlinePartnerSockets.size,
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
    }
  });
});

// GET /metrics - Operational metrics
router.get('/metrics', async (_req: Request, res: Response) => {
  let totalGeoPartners = 0;
  try {
    totalGeoPartners = await redis.zcard(KEYS.GEO_ONLINE_PARTNERS);
  } catch (err) {
    totalGeoPartners = 0;
  }

  const activeBookings = Array.from(activeBookingsMap.values());

  const statusCounts = activeBookings.reduce((acc: Record<string, number>, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return res.json({
    timestamp: new Date().toISOString(),
    onlinePartnersInSockets: onlinePartnerSockets.size,
    onlinePartnersInRedisGeo: totalGeoPartners,
    totalBookingsInSystem: activeBookingsMap.size,
    bookingsByStatus: statusCounts,
    dispatchConfig: {
      searchRadiiKm: [3, 5, 8, 12],
      partnerOfferTimeoutSeconds: 15,
      heartbeatIntervalSeconds: 10,
      staleLocationTimeoutSeconds: 30
    }
  });
});

export default router;
