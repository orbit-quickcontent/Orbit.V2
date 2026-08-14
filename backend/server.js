const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const axios = require('axios');
const { Server } = require('socket.io');

const nearbyRouter = require('./routes/nearby');
const routeRouter = require('./routes/route');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const JWT_SECRET = process.env.JWT_SECRET || 'orbit_secret';

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (!token) {
      // Fallback for dev / unauthenticated tracking sockets
      socket.user = { id: socket.id, role: 'guest' };
      return next();
    }
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (e) {
    socket.user = { id: socket.id, role: 'guest' };
    next();
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (user: ${socket.user?.id || 'guest'})`);

  socket.on('partner_location', async (data) => {
    try {
      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const partnerId = socket.user?.id || data.partnerId || socket.id;
      const key = `partner:${partnerId}`;

      // Redis GEOADD: store online partner location
      await redis.geoadd('partners:online', lng, lat, partnerId);
      await redis.set(key, JSON.stringify({ partnerId, lat, lng, ts: Date.now() }), 'EX', 60);

      // Broadcast to room or all clients
      io.emit('partner_location_update', { partnerId, lat, lng, ts: Date.now() });
      if (data.bookingId) {
        io.to(`booking:${data.bookingId}`).emit('location_update', { partnerId, lat, lng });
      }
    } catch (err) {
      console.error('Error handling partner_location:', err.message);
    }
  });

  socket.on('join_booking', (data) => {
    const bookingId = typeof data === 'string' ? data : data?.bookingId;
    if (bookingId) {
      socket.join(`booking:${bookingId}`);
      console.log(`Socket ${socket.id} joined room booking:${bookingId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Attach routers with redis injected
app.use((req, res, next) => {
  req.redis = redis;
  next();
});

app.use('/partners/nearby', nearbyRouter);
app.use('/route', routeRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`ORBIT free dispatch & tracking server running on port ${PORT}`);
});
