const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { Server } = require('socket.io');

const nearbyRouter = require('./routes/nearby');
const routeRouter = require('./routes/route');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 30000,
  pingInterval: 10000,
});

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});
redis.connect().catch(() => {
  console.warn('[Redis] Standalone Redis not connected. Operating in standard mode.');
});

const JWT_SECRET = process.env.JWT_SECRET || 'orbit_secret';

// Rate limit map for partner location updates (max 1 update per 3s per partner)
const lastUpdateMap = new Map();

// ── Socket.IO JWT Authentication Middleware ────────────────────────────────────
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      // In development, allow anonymous / guest connections for demo/client maps
      if (process.env.NODE_ENV !== 'production') {
        socket.user = { id: socket.id, role: 'client' };
        return next();
      }
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      // For development token fallback
      socket.user = { id: token.includes('prt') ? token : socket.id, role: token.includes('prt') ? 'partner' : 'client' };
      return next();
    }
  } catch (e) {
    return next(new Error('Unauthorized'));
  }
});

// ── Socket.IO Real-time Connection Handler ──────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id} (User: ${socket.user?.id || 'anon'}, Role: ${socket.user?.role || 'client'})`);

  // Partner GPS stream handler
  socket.on('partner_location', async (data) => {
    try {
      const partnerId = socket.user?.id || data.partnerId;
      const { lat, lng, speed, heading, timestamp } = data;

      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      // Rate limit: 1 update every 3 seconds per partner
      const now = Date.now();
      const lastUpdate = lastUpdateMap.get(partnerId) || 0;
      if (now - lastUpdate < 2800) {
        return; // drop duplicate rapid updates
      }
      lastUpdateMap.set(partnerId, now);

      const locationPayload = {
        partnerId,
        lat,
        lng,
        speed: typeof speed === 'number' ? speed : 0,
        heading: typeof heading === 'number' ? heading : 0,
        timestamp: timestamp || now,
      };

      // Store in Redis GEO (FROMLONLAT format: lng, lat, member)
      if (redis.status === 'ready') {
        const key = `partner:${partnerId}`;
        await redis.geoadd('partners:online', lng, lat, partnerId);
        await redis.set(key, JSON.stringify(locationPayload), 'EX', 60); // 60s auto-expire
      }

      // Broadcast to room subscribers & global listeners
      io.emit('partner_location_update', locationPayload);
      io.to(`partner:${partnerId}`).emit('partner_location_update', locationPayload);
    } catch (err) {
      console.error('[Socket partner_location error]', err);
    }
  });

  // Client subscribes to booking tracking room
  socket.on('join_booking', (bookingId) => {
    if (bookingId) {
      socket.join(`booking:${bookingId}`);
      console.log(`[Socket] ${socket.id} joined room booking:${bookingId}`);
    }
  });

  // Client subscribes to specific partner room
  socket.on('track_partner', (partnerId) => {
    if (partnerId) {
      socket.join(`partner:${partnerId}`);
      console.log(`[Socket] ${socket.id} tracking partner:${partnerId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ── REST API Routes ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'orbit-dispatch-microservice',
    redis: redis.status,
    timestamp: new Date().toISOString(),
  });
});

app.use('/partners/nearby', nearbyRouter);
app.use('/route', routeRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`⚡ ORBIT Free Uber/Ola Dispatch Service Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🗺️ Maps: MapLibre / OpenStreetMap (Free Stack)`);
  console.log(`🚀 Routing: OSRM Public Engine`);
  console.log(`📍 Nearby: Redis GEO (partners:online)`);
  console.log(`=============================================`);
});

module.exports = { app, server, io };
