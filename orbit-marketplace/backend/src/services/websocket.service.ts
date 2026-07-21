import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';

export function initWebSocketService() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = new HttpServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io/'
  });

  // Track online partners: partnerId -> Set of socket IDs
  const onlinePartners = new Map<string, Set<string>>();
  // Track client booking room subscriptions: socket.id -> bookingId
  const socketSubscriptions = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Socket connected: ${socket.id}`);

    // Partner goes online
    socket.on('partner:online', ({ partnerId }: { partnerId: string }) => {
      if (!partnerId) return;
      console.log(`[WS] Partner online: ${partnerId} (socket: ${socket.id})`);
      if (!onlinePartners.has(partnerId)) {
        onlinePartners.set(partnerId, new Set());
      }
      onlinePartners.get(partnerId)!.add(socket.id);
      (socket as any).partnerId = partnerId;
    });

    // Partner goes offline
    socket.on('partner:offline', ({ partnerId }: { partnerId: string }) => {
      if (!partnerId) return;
      console.log(`[WS] Partner offline: ${partnerId} (socket: ${socket.id})`);
      const sockets = onlinePartners.get(partnerId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlinePartners.delete(partnerId);
        }
      }
    });

    // Client subscribes to a specific booking room
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
          if (sockets.size === 0) {
            onlinePartners.delete(partnerId);
          }
        }
      }
      socketSubscriptions.delete(socket.id);
    });
  });

  // REST API Endpoints on port 3003

  // 1. Dispatch notification
  app.post('/internal/dispatch', (req, res) => {
    const { bookingId, partnerIds, booking, round } = req.body;
    console.log(`[WS] Internal Dispatch notification: booking:${bookingId} to partners:`, partnerIds);

    if (Array.isArray(partnerIds)) {
      partnerIds.forEach((partnerId) => {
        const sockets = onlinePartners.get(partnerId);
        if (sockets) {
          sockets.forEach((socketId) => {
            io.to(socketId).emit('booking:dispatched', {
              booking,
              dispatchId: bookingId,
              round
            });
          });
        }
      });
    }

    res.json({ success: true });
  });

  // 2. Accept notification
  app.post('/internal/accept', (req, res) => {
    const { bookingId, partnerId, partnerName } = req.body;
    console.log(`[WS] Internal Accept notification: booking:${bookingId} accepted by partner:${partnerId}`);

    // Notify subscribed clients
    io.to(`booking:${bookingId}`).emit('booking:partner-assigned', {
      bookingId,
      partnerId,
      partnerName
    });

    // Notify other online partners to remove the dispatch card from their UI
    onlinePartners.forEach((sockets, onlinePartnerId) => {
      if (onlinePartnerId !== partnerId) {
        sockets.forEach((socketId) => {
          io.to(socketId).emit('booking:accepted-by-other', {
            bookingId,
            acceptedByPartnerId: partnerId
          });
        });
      }
    });

    res.json({ success: true });
  });

  // 3. General client event notification
  app.post('/internal/notify-client', (req, res) => {
    const { bookingId, event, payload } = req.body;
    if (!bookingId || !event) {
      return res.status(400).json({ error: 'Missing bookingId or event' });
    }

    console.log(`[WS] Internal notification: booking:${bookingId} -> event: ${event}`);
    io.to(`booking:${bookingId}`).emit(event, payload);
    res.json({ success: true });
  });

  // 4. Check partner online status
  app.get('/internal/partners/:partnerId/status', (req, res) => {
    const { partnerId } = req.params;
    const isOnline = onlinePartners.has(partnerId);
    res.json({ partnerId, isOnline });
  });

  const PORT = 3003;
  server.listen(PORT, () => {
    console.log(`[WS] WebSocket server running on port ${PORT}`);
  });

  return { server, io };
}
