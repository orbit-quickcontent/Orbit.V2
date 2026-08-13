import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import { LocationService } from './location.service';
import { dbClient } from './db.service';
import { removePartnerPresence, setPartnerPresence } from './redis.service';
import { verifyToken, JWTPayload } from '../lib/security-auth';

let _io: SocketIOServer | null = null;
const onlinePartners = new Map<string, Set<string>>();
const socketSubscriptions = new Map<string, string>();
const OFFER_TIMEOUT_MS = Number(process.env.DISPATCH_OFFER_TIMEOUT_MS || 15000);

export function getIo(): SocketIOServer | null {
  return _io;
}

export function getOnlinePartnerIds(): string[] {
  return Array.from(onlinePartners.keys());
}

export function notifyDispatch(payload: {
  bookingId: string;
  partnerIds: string[];
  booking: any;
  round: number;
}) {
  if (!_io) return;

  const { bookingId, partnerIds, booking, round } = payload;
  const eventPayload = {
    booking,
    bookingId,
    id: bookingId,
    dispatchId: bookingId,
    round: round || 1,
    expiresAt: new Date(Date.now() + OFFER_TIMEOUT_MS).toISOString(),
  };

  for (const partnerId of partnerIds) {
    const sockets = onlinePartners.get(partnerId);
    sockets?.forEach((socketId) => {
      _io!.to(socketId).emit('booking:dispatched', eventPayload);
      _io!.to(socketId).emit('booking:offer', eventPayload);
    });
  }
}

export function notifyAccept(payload: {
  bookingId: string;
  partnerId: string;
  partnerName: string;
  booking?: any;
}) {
  if (!_io) return;
  const { bookingId, partnerId, partnerName, booking } = payload;

  _io.to(`booking:${bookingId}`).emit('booking:partner-assigned', {
    bookingId,
    partnerId,
    partnerName,
    booking,
  });

  onlinePartners.forEach((sockets, onlinePartnerId) => {
    if (onlinePartnerId === partnerId) return;
    sockets.forEach((socketId) => {
      _io!.to(socketId).emit('booking:accepted-by-other', {
        bookingId,
        acceptedByPartnerId: partnerId,
      });
    });
  });
}

export function notifyClient(payload: {
  bookingId: string;
  event: string;
  data: any;
}) {
  if (!_io) return;
  _io.to(`booking:${payload.bookingId}`).emit(payload.event, payload.data);
}

function allowedOrigins(): string[] {
  return [
    'https://orbit-quickcontent.com',
    'https://www.orbit-quickcontent.com',
    'https://app.orbit-quickcontent.com',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'capacitor://localhost',
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://10.0.2.2:5000',
  ];
}

function extractSocketToken(socket: Socket): string | null {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth) return fromAuth;
  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string') return header;
  return null;
}

async function resolvePartnerId(user: JWTPayload | null, requestedPartnerId: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production' && !user) return Boolean(requestedPartnerId);
  if (!user || user.type !== 'access' || user.role !== 'PARTNER') return false;
  const partner = await dbClient.partner.findUnique({ where: { userId: user.id } });
  return Boolean(partner && partner.id === requestedPartnerId);
}

export function initWebSocketService(existingServer?: HttpServer) {
  const app = existingServer ? undefined : express();
  if (app) {
    app.use(cors({ origin: allowedOrigins(), credentials: true }));
    app.use(express.json());
  }

  const server = existingServer || new HttpServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins().includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy violation'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    path: '/socket.io/',
  });

  io.use((socket, next) => {
    const rawToken = extractSocketToken(socket);
    const token = rawToken?.replace(/^Bearer\s+/i, '').trim();
    const user = token ? verifyToken(token) : null;

    if (process.env.NODE_ENV === 'production' && (!user || user.type !== 'access')) {
      return next(new Error('Unauthorized'));
    }

    socket.data.user = user;
    next();
  });

  _io = io;

  io.on('connection', (socket: Socket) => {
    const user = (socket.data.user || null) as JWTPayload | null;

    socket.on('partner:online', async ({ partnerId }: { partnerId: string }) => {
      if (!(await resolvePartnerId(user, partnerId))) {
        socket.emit('socket:denied', { reason: 'Invalid partner identity' });
        return;
      }
      if (!onlinePartners.has(partnerId)) onlinePartners.set(partnerId, new Set());
      onlinePartners.get(partnerId)!.add(socket.id);
      socket.data.partnerId = partnerId;
    });

    socket.on('partner:offline', async ({ partnerId }: { partnerId: string }) => {
      if (!(await resolvePartnerId(user, partnerId))) return;
      const sockets = onlinePartners.get(partnerId);
      sockets?.delete(socket.id);
      if (sockets && sockets.size === 0) onlinePartners.delete(partnerId);
      await removePartnerPresence(partnerId).catch(() => undefined);
    });

    socket.on('client:subscribe', async ({ bookingId }: { bookingId: string }) => {
      if (!bookingId) return;
      if (process.env.NODE_ENV === 'production' && (!user || user.type !== 'access')) return;

      if (user?.role === 'CLIENT') {
        const booking = await dbClient.booking.findUnique({ where: { id: bookingId }, select: { userId: true } });
        if (!booking || booking.userId !== user.id) {
          socket.emit('socket:denied', { reason: 'Booking subscription denied' });
          return;
        }
      }

      socket.join(`booking:${bookingId}`);
      socketSubscriptions.set(socket.id, bookingId);
    });

    socket.on('partner:updateLocation', async (payload: {
      partnerId: string;
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
    }) => {
      const { partnerId, lat, lng, heading, speed } = payload || {};
      if (!(await resolvePartnerId(user, partnerId))) return;
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const lastLocationAt = new Date();
      const locationService = LocationService.getInstance();
      locationService.updateLocation(partnerId, lat, lng, heading, speed);

      await Promise.all([
        dbClient.partner.update({
          where: { id: partnerId },
          data: {
            latitude: lat,
            longitude: lng,
            lastSeenAt: lastLocationAt,
            lastLocationAt,
            availability: true,
          },
        }),
        setPartnerPresence(partnerId, lat, lng),
      ]).catch((error) => {
        console.warn('[WS] location persistence failed:', error?.message);
      });

      _io?.emit('partner:location', {
        partnerId,
        lat,
        lng,
        heading: heading ?? null,
        speed: speed ?? null,
        timestamp: lastLocationAt.toISOString(),
      });
    });

    socket.on('disconnect', async () => {
      const partnerId = socket.data.partnerId as string | undefined;
      if (partnerId) {
        const sockets = onlinePartners.get(partnerId);
        sockets?.delete(socket.id);
        if (sockets && sockets.size === 0) {
          onlinePartners.delete(partnerId);
          await removePartnerPresence(partnerId).catch(() => undefined);
        }
      }
      socketSubscriptions.delete(socket.id);
    });
  });

  const checkSecret = (req: express.Request, res: express.Response): boolean => {
    const secret = process.env.INTERNAL_WS_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Internal WebSocket secret is not configured' });
      return false;
    }
    if (!secret || req.headers['x-internal-secret'] === secret) return true;
    res.status(401).json({ error: 'Unauthorized: Invalid internal secret' });
    return false;
  };

  if (app) {
    app.post('/internal/dispatch', (req, res) => {
      if (!checkSecret(req, res)) return;
      notifyDispatch(req.body);
      res.json({ success: true });
    });
    app.post('/internal/accept', (req, res) => {
      if (!checkSecret(req, res)) return;
      notifyAccept(req.body);
      res.json({ success: true });
    });
    app.post('/internal/notify-client', (req, res) => {
      if (!checkSecret(req, res)) return;
      const { bookingId, event, payload } = req.body;
      if (!bookingId || !event) return res.status(400).json({ error: 'Missing bookingId or event' });
      notifyClient({ bookingId, event, data: payload });
      res.json({ success: true });
    });
    app.get('/internal/partners/:partnerId/status', (req, res) => {
      res.json({ partnerId: req.params.partnerId, isOnline: onlinePartners.has(req.params.partnerId) });
    });
  }

  if (!existingServer) {
    const WS_PORT = Number(process.env.WS_PORT) || 3003;
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[WS Warning] Port ${WS_PORT} is already in use.`);
      } else {
        console.error('[WS Error]', err);
      }
    });
    server.listen(WS_PORT, () => {
      console.log(`[WS] Standalone WebSocket server running on port ${WS_PORT}`);
    });
  }

  return { server, io };
}
