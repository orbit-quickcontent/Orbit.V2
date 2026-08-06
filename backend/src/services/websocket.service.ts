import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';

// ── Singleton io reference ─────────────────────────────────────────────────────
let _io: SocketIOServer | null = null;

/** Returns the active Socket.IO server, or null before initWebSocketService() runs. */
export function getIo(): SocketIOServer | null {
  return _io;
}

// ── Online partner tracking ────────────────────────────────────────────────────
const onlinePartners = new Map<string, Set<string>>();
const socketSubscriptions = new Map<string, string>();

// ── Exported notification helpers (called in-process by route handlers) ────────

/**
 * Push a booking:dispatched event to a list of partners.
 * No-ops silently if the WS server is not yet initialised.
 */
export function notifyDispatch(payload: {
  bookingId: string;
  partnerIds: string[];
  booking: any;
  round: number;
}) {
  if (!_io) return;
  const { bookingId, partnerIds, booking, round } = payload;
  console.log(`[WS] Dispatch notification: booking:${bookingId} to partners:`, partnerIds);
  partnerIds.forEach((partnerId) => {
    const sockets = onlinePartners.get(partnerId);
    if (sockets) {
      sockets.forEach((socketId) => {
        _io!.to(socketId).emit('booking:dispatched', { booking, dispatchId: bookingId, round });
      });
    }
  });
}

/**
 * Push booking:partner-assigned to the client room and booking:accepted-by-other
 * to every other online partner. No-ops if WS not yet initialised.
 */
export function notifyAccept(payload: {
  bookingId: string;
  partnerId: string;
  partnerName: string;
  booking?: any;
}) {
  if (!_io) return;
  const { bookingId, partnerId, partnerName, booking } = payload;
  console.log(`[WS] Accept notification: booking:${bookingId} accepted by partner:${partnerId}`);
  _io.to(`booking:${bookingId}`).emit('booking:partner-assigned', { bookingId, partnerId, partnerName, booking });
  onlinePartners.forEach((sockets, onlinePartnerId) => {
    if (onlinePartnerId !== partnerId) {
      sockets.forEach((socketId) => {
        _io!.to(socketId).emit('booking:accepted-by-other', { bookingId, acceptedByPartnerId: partnerId });
      });
    }
  });
}

/**
 * Emit an arbitrary event to the client room for a booking.
 * No-ops if WS not yet initialised.
 */
export function notifyClient(payload: {
  bookingId: string;
  event: string;
  data: any;
}) {
  if (!_io) return;
  const { bookingId, event, data } = payload;
  console.log(`[WS] Client notification: booking:${bookingId} -> event: ${event}`);
  _io.to(`booking:${bookingId}`).emit(event, data);
}

// ── Main init ──────────────────────────────────────────────────────────────────
export function initWebSocketService() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = new HttpServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: [
        'https://orbit-quickcontent.com',
        'https://www.orbit-quickcontent.com',
        'https://app.orbit-quickcontent.com',
        'https://api.orbit-quickcontent.com',
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'capacitor://localhost',
        'http://localhost',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    path: '/socket.io/'
  });

  // Assign singleton
  _io = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Socket connected: ${socket.id}`);

    socket.on('partner:online', ({ partnerId }: { partnerId: string }) => {
      if (!partnerId) return;
      console.log(`[WS] Partner online: ${partnerId} (socket: ${socket.id})`);
      if (!onlinePartners.has(partnerId)) {
        onlinePartners.set(partnerId, new Set());
      }
      onlinePartners.get(partnerId)!.add(socket.id);
      (socket as any).partnerId = partnerId;
    });

    socket.on('partner:offline', ({ partnerId }: { partnerId: string }) => {
      if (!partnerId) return;
      console.log(`[WS] Partner offline: ${partnerId} (socket: ${socket.id})`);
      const sockets = onlinePartners.get(partnerId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlinePartners.delete(partnerId);
      }
    });

    socket.on('client:subscribe', ({ bookingId }: { bookingId: string }) => {
      if (!bookingId) return;
      console.log(`[WS] Client subscribed to booking: ${bookingId} (socket: ${socket.id})`);
      socket.join(`booking:${bookingId}`);
      socketSubscriptions.set(socket.id, bookingId);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Socket disconnected: ${socket.id}`);
      const partnerId = (socket as any).partnerId;
      if (partnerId) {
        const sockets = onlinePartners.get(partnerId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) onlinePartners.delete(partnerId);
        }
      }
      socketSubscriptions.delete(socket.id);
    });
  });

  // ── Internal REST shim (for backward-compat with any external callers) ───────
  // Protected by INTERNAL_WS_SECRET env var when set.
  const checkSecret = (req: express.Request, res: express.Response): boolean => {
    const secret = process.env.INTERNAL_WS_SECRET;
    if (!secret) return true; // not configured — allow (dev/local mode)
    if (req.headers['x-internal-secret'] === secret) return true;
    res.status(403).json({ error: 'Forbidden' });
    return false;
  };

  app.post('/internal/dispatch', (req, res) => {
    if (!checkSecret(req, res)) return;
    const { bookingId, partnerIds, booking, round } = req.body;
    notifyDispatch({ bookingId, partnerIds, booking, round });
    res.json({ success: true });
  });

  app.post('/internal/accept', (req, res) => {
    if (!checkSecret(req, res)) return;
    const { bookingId, partnerId, partnerName, booking } = req.body;
    notifyAccept({ bookingId, partnerId, partnerName, booking });
    res.json({ success: true });
  });

  app.post('/internal/notify-client', (req, res) => {
    if (!checkSecret(req, res)) return;
    const { bookingId, event, payload } = req.body;
    if (!bookingId || !event) {
      return res.status(400).json({ error: 'Missing bookingId or event' });
    }
    notifyClient({ bookingId, event, data: payload });
    res.json({ success: true });
  });

  app.get('/internal/partners/:partnerId/status', (req, res) => {
    const { partnerId } = req.params;
    const isOnline = onlinePartners.has(partnerId);
    res.json({ partnerId, isOnline });
  });

  const WS_PORT = Number(process.env.WS_PORT) || 3003;
  server.listen(WS_PORT, () => {
    console.log(`[WS] WebSocket server running on port ${WS_PORT}`);
  });

  return { server, io };
}
