import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket, socketAuthMiddleware } from './auth';
import {
  addPartnerLocationGeo,
  removePartnerGeo,
  setPartnerPresence,
  getPartnerPresence,
  recordPartnerResponseMetric
} from './redis';
import { GeoLocation, PartnerPresence } from './types';

export let io: SocketIOServer;

// Map of partnerId -> socketId (In-Memory Lookup for Active Node Instance)
export const onlinePartnerSockets = new Map<string, string>();
// Map of socketId -> partnerId
export const socketToPartnerMap = new Map<string, string>();
// Heartbeat timestamps: partnerId -> lastHeartbeatMs
const heartbeatMap = new Map<string, number>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  // Apply Auth Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`[Socket Connected] User ${user.id} (${user.name}) - Role: ${user.role} - Socket: ${socket.id}`);

    // Join personal user room
    socket.join(`user:${user.id}`);

    if (user.role === 'PARTNER') {
      socket.join('role:partner');
    } else if (user.role === 'CLIENT') {
      socket.join('role:client');
    } else if (user.role === 'EDITOR') {
      socket.join('role:editor');
    } else if (user.role === 'ADMIN') {
      socket.join('role:admin');
    }

    // --- PARTNER EVENT HANDLERS ---

    socket.on('partner_online', async () => {
      if (user.role !== 'PARTNER') return;

      onlinePartnerSockets.set(user.id, socket.id);
      socketToPartnerMap.set(socket.id, user.id);
      heartbeatMap.set(user.id, Date.now());

      const presence: PartnerPresence = {
        partnerId: user.id,
        socketId: socket.id,
        isOnline: true,
        lastSeenAt: Date.now(),
        activeBookingsCount: 0,
        totalAccepted: 0,
        totalRejected: 0,
        totalTimedOut: 0,
        location: null
      };

      await setPartnerPresence(user.id, presence);
      console.log(`[Partner Online] Partner ${user.id} is now ONLINE`);

      socket.emit('partner_presence_ack', { isOnline: true, timestamp: Date.now() });
    });

    socket.on('partner_offline', async () => {
      if (user.role !== 'PARTNER') return;
      await handlePartnerDisconnect(user.id, socket.id);
      socket.emit('partner_presence_ack', { isOnline: false, timestamp: Date.now() });
    });

    socket.on('partner_location', async (data: { lat: number; lng: number; speed?: number; heading?: number; timestamp?: number }) => {
      if (user.role !== 'PARTNER') return;

      const { lat, lng, speed = 0, heading = 0, timestamp = Date.now() } = data;
      heartbeatMap.set(user.id, Date.now());

      const location: GeoLocation = {
        latitude: lat,
        longitude: lng,
        speed,
        heading,
        timestamp
      };

      // Add to Redis GEO
      await addPartnerLocationGeo(user.id, location);

      // Update Presence in Redis
      const existingPresence = await getPartnerPresence(user.id);
      const presence: PartnerPresence = {
        partnerId: user.id,
        socketId: socket.id,
        isOnline: true,
        lastSeenAt: Date.now(),
        activeBookingsCount: existingPresence?.activeBookingsCount || 0,
        totalAccepted: existingPresence?.totalAccepted || 0,
        totalRejected: existingPresence?.totalRejected || 0,
        totalTimedOut: existingPresence?.totalTimedOut || 0,
        location
      };
      await setPartnerPresence(user.id, presence);

      // Broadcast location to active booking room if assigned
      socket.to(`partner:${user.id}:location`).emit('partner_location', {
        partnerId: user.id,
        latitude: lat,
        longitude: lng,
        speed,
        heading,
        timestamp
      });
    });

    socket.on('heartbeat', () => {
      if (user.role === 'PARTNER') {
        heartbeatMap.set(user.id, Date.now());
        socket.emit('heartbeat_ack', { timestamp: Date.now() });
      }
    });

    socket.on('booking_response', async (data: { bookingId: string; accepted: boolean; reason?: string }) => {
      if (user.role !== 'PARTNER') return;

      const { bookingId, accepted, reason } = data;
      console.log(`[Booking Response] Partner ${user.id} responded ${accepted ? 'ACCEPT' : 'REJECT'} for booking ${bookingId}`);

      if (accepted) {
        await recordPartnerResponseMetric(user.id, 'accept');
      } else {
        await recordPartnerResponseMetric(user.id, 'reject');
      }

      // Emit event internally for dispatch pipeline promise waiting
      io.emit(`booking_response:${bookingId}`, {
        bookingId,
        partnerId: user.id,
        accepted,
        reason
      });
    });

    // --- CLIENT EVENT HANDLERS ---
    socket.on('subscribe_booking', (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
      console.log(`[Socket] User ${user.id} subscribed to booking room ${bookingId}`);
    });

    socket.on('unsubscribe_booking', (bookingId: string) => {
      socket.leave(`booking:${bookingId}`);
    });

    socket.on('disconnect', async () => {
      console.log(`[Socket Disconnected] Socket ${socket.id} (User ${user.id})`);
      if (user.role === 'PARTNER') {
        await handlePartnerDisconnect(user.id, socket.id);
      }
    });
  });

  // Background Heartbeat Monitor: Checks every 10 seconds for dead partner connections (stale > 30 seconds)
  setInterval(async () => {
    const now = Date.now();
    for (const [partnerId, lastHeartbeat] of heartbeatMap.entries()) {
      if (now - lastHeartbeat > 30000) {
        console.warn(`[Heartbeat Stale] Partner ${partnerId} missed heartbeats (>30s). Marking offline.`);
        const socketId = onlinePartnerSockets.get(partnerId);
        if (socketId) {
          await handlePartnerDisconnect(partnerId, socketId);
        }
      }
    }
  }, 10000);

  return io;
}

async function handlePartnerDisconnect(partnerId: string, socketId: string) {
  onlinePartnerSockets.delete(partnerId);
  socketToPartnerMap.delete(socketId);
  heartbeatMap.delete(partnerId);

  await removePartnerGeo(partnerId);

  const existingPresence = await getPartnerPresence(partnerId);
  if (existingPresence) {
    existingPresence.isOnline = false;
    existingPresence.lastSeenAt = Date.now();
    await setPartnerPresence(partnerId, existingPresence);
  }

  console.log(`[Partner Offline] Partner ${partnerId} set to OFFLINE`);
}

export function sendToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function broadcastToBooking(bookingId: string, event: string, data: any): void {
  if (io) {
    io.to(`booking:${bookingId}`).emit(event, data);
  }
}

export function broadcastToRole(role: string, event: string, data: any): void {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
}
