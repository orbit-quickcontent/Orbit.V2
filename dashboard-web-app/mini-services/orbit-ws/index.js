const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  path: '/socket.io/'
});

// Track online partners: partnerId -> Set of socket IDs
const onlinePartners = new Map();
// Track client booking room subscriptions: socket.id -> bookingId
const socketSubscriptions = new Map();

io.on('connection', (socket) => {
  console.log(`[WS] Socket connected: ${socket.id}`);

  // Partner goes online
  socket.on('partner:online', ({ partnerId }) => {
    if (!partnerId) return;
    console.log(`[WS] Partner online: ${partnerId} (socket: ${socket.id})`);
    if (!onlinePartners.has(partnerId)) {
      onlinePartners.set(partnerId, new Set());
    }
    onlinePartners.get(partnerId).add(socket.id);
    socket.partnerId = partnerId;
  });

  // Partner goes offline
  socket.on('partner:offline', ({ partnerId }) => {
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
  socket.on('client:subscribe', ({ bookingId }) => {
    if (!bookingId) return;
    console.log(`[WS] Client subscribed to booking: ${bookingId} (socket: ${socket.id})`);
    socket.join(`booking:${bookingId}`);
    socketSubscriptions.set(socket.id, bookingId);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Socket disconnected: ${socket.id}`);
    if (socket.partnerId) {
      const sockets = onlinePartners.get(socket.partnerId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlinePartners.delete(socket.partnerId);
        }
      }
    }
    socketSubscriptions.delete(socket.id);
  });
});

// HTTP endpoint for internal service notifications
app.post('/internal/notify-client', (req, res) => {
  const { bookingId, event, payload } = req.body;
  if (!bookingId || !event) {
    return res.status(400).json({ error: 'Missing bookingId or event' });
  }

  console.log(`[WS] Internal notification: booking:${bookingId} -> event: ${event}`);
  io.to(`booking:${bookingId}`).emit(event, payload);
  res.json({ success: true });
});

// HTTP endpoint for checking partner online status
app.get('/internal/partners/:partnerId/status', (req, res) => {
  const { partnerId } = req.params;
  const isOnline = onlinePartners.has(partnerId);
  res.json({ partnerId, isOnline });
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`[WS] WebSocket server running on port ${PORT}`);
});