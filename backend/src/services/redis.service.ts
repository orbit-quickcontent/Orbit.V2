import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  redis = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  });
  redis.on('error', (error) => console.warn('[Redis]', error.message));
  return redis;
}

export async function connectRedis(): Promise<Redis | null> {
  const client = getRedis();
  if (!client) return null;
  if (client.status === 'wait') await client.connect();
  return client;
}

export async function setPartnerPresence(partnerId: string, lat: number, lng: number): Promise<void> {
  const client = await connectRedis();
  if (!client) return;
  await client.geoadd('orbit:partners:geo', lng, lat, partnerId);
  await client.hset(`orbit:partner:${partnerId}`, {
    online: '1',
    lat: String(lat),
    lng: String(lng),
    lastSeen: new Date().toISOString(),
  });
  await client.expire(`orbit:partner:${partnerId}`, 90);
}

export async function removePartnerPresence(partnerId: string): Promise<void> {
  const client = await connectRedis();
  if (!client) return;
  await client.hset(`orbit:partner:${partnerId}`, 'online', '0');
  await client.expire(`orbit:partner:${partnerId}`, 90);
}

export async function nearbyOnlinePartners(lat: number, lng: number, radiusKm: number, limit = 25): Promise<string[]> {
  const client = await connectRedis();
  if (!client) return [];
  const candidates = await client.geosearch(
    'orbit:partners:geo',
    'FROMLONLAT', lng, lat,
    'BYRADIUS', radiusKm, 'km',
    'ASC',
    'COUNT', limit,
  );
  if (!candidates.length) return [];
  const pipeline = client.pipeline();
  candidates.forEach((id) => pipeline.hget(`orbit:partner:${id}`, 'online'));
  const statuses = await pipeline.exec();
  return candidates.filter((_, index) => statuses?.[index]?.[1] === '1');
}

export async function acquireBookingLock(bookingId: string, partnerId: string, ttlMs = 15000): Promise<boolean> {
  const client = await connectRedis();
  if (!client) return true;
  const result = await client.set(`orbit:booking:${bookingId}:accept`, partnerId, 'PX', ttlMs, 'NX');
  return result === 'OK';
}
