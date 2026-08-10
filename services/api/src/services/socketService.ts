import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { processPartnerLocationUpdate } from './partnerService';
import { handlePartnerAccept, handlePartnerReject } from './dispatchService';

let io: SocketIOServer;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  // JWT Middleware for Socket Connections
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated connections for guest client/admin map if needed
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`[SOCKET_CONNECT] Socket ID: ${socket.id}, User: ${user?.id || 'Guest'}`);

    // Join Admin Map Room if requested
    socket.on('admin:joinMap', () => {
      socket.join('admin:map');
      console.log(`[SOCKET] Socket ${socket.id} joined admin:map room`);
    });

    // Partner Socket Events
    socket.on('partner:connect', (data?: { partnerId?: string }) => {
      const partnerId = user?.partnerId || data?.partnerId;
      if (partnerId) {
        socket.join(`partner:${partnerId}`);
        console.log(`[SOCKET] Partner ${partnerId} joined partner:${partnerId} room`);
      }
    });

    socket.on('partner:location', async (data: { latitude: number; longitude: number; speed?: number; heading?: number }) => {
      const partnerId = user?.partnerId || data?.latitude && user?.id;
      if (!partnerId) return;

      try {
        await processPartnerLocationUpdate(partnerId, {
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
        });
      } catch (err) {
        console.error(`[SOCKET_LOCATION_ERR] ${err}`);
      }
    });

    socket.on('booking:accepted', async (data: { bookingId: string; partnerId?: string }) => {
      const partnerId = user?.partnerId || data.partnerId;
      if (partnerId && data.bookingId) {
        await handlePartnerAccept(data.bookingId, partnerId);
      }
    });

    socket.on('booking:rejected', async (data: { bookingId: string; partnerId?: string }) => {
      const partnerId = user?.partnerId || data.partnerId;
      if (partnerId && data.bookingId) {
        await handlePartnerReject(data.bookingId, partnerId);
      }
    });

    // Client Socket Events
    socket.on('client:subscribeBooking', (data: { bookingId: string }) => {
      if (data?.bookingId) {
        socket.join(`booking:${data.bookingId}`);
        console.log(`[SOCKET] Client subscribed to room booking:${data.bookingId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET_DISCONNECT] Socket ID: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastPartnerLocationUpdate(data: {
  partnerId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  status: string;
}): void {
  if (!io) return;

  // Broadcast to Admin Dashboard Live Map Room
  io.to('admin:map').emit('partner:locationUpdate', data);

  // Broadcast to partner room
  io.to(`partner:${data.partnerId}`).emit('partner:locationUpdate', data);
}

export function sendBookingOfferToPartner(partnerId: string, offer: any): void {
  if (!io) return;
  io.to(`partner:${partnerId}`).emit('booking:offer', offer);
}

export function notifyBookingStatusChanged(
  bookingId: string,
  status: string,
  partnerId?: string | null,
  message?: string
): void {
  if (!io) return;
  const payload = { bookingId, status, partnerId, message, updatedAt: new Date().toISOString() };
  io.to(`booking:${bookingId}`).emit('booking:statusChanged', payload);
  if (partnerId) {
    io.to(`partner:${partnerId}`).emit('booking:statusChanged', payload);
  }
  io.to('admin:map').emit('booking:statusChanged', payload);
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO server not initialized');
  return io;
}
