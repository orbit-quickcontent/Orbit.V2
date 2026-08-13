const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'orbit_super_secret_jwt_key_2026_production_ready';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const DISPATCH_TIMEOUT_MS = 20000; // 20-second offer timeout per partner

const app = express();
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);

// ── Socket.IO Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// ── Redis Setup (With In-Memory Fallback if Redis is Offline) ───────────────
let redisClient = null;
let isRedisAvailable = false;

// Fallback in-memory state for dev when Redis is not running
const inMemoryPartners = new Map(); // partnerId -> { lat, lng, online, updatedAt }

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('[Redis] Connection failed. Using in-memory geospatial fallback.');
        return null; // Stop retrying
      }
      return Math.min(times * 1000, 3000);
    },
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log('[Redis] Connected successfully to', REDIS_URL);
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
  });
} catch (err) {
  console.warn('[Redis] Initialization warning:', err.message);
}

// ── Geospatial Haversine Fallback Helper ────────────────────────────────────
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Active Memory Maps ──────────────────────────────────────────────────────
const partnerSockets = new Map(); // partnerId -> Set of socketIds
const socketToPartner = new Map(); // socketId -> partnerId
const activeBookings = new Map(); // bookingId -> Booking object
const acceptanceCallbacks = new Map(); // `${bookingId}:${partnerId}` -> { resolve, rejectTimer }

// ── Helper: Find Nearest Partners ───────────────────────────────────────────
async function findNearbyPartners(lat, lng, radiusKm = 5) {
  if (isRedisAvailable && redisClient) {
    try {
      // Redis GEOSEARCH (Redis >= 6.2)
      // GEORADIUS or GEOSEARCH partners:online FROMLONLAT lng lat BYRADIUS radiusKm km WITHDIST ASC
      const rawResults = await redisClient.send_command(
        'GEOSEARCH',
        'partners:online',
        'FROMLONLAT',
        lng,
        lat,
        'BYRADIUS',
        radiusKm,
        'km',
        'WITHDIST',
        'ASC'
      );

      // Raw results: [ [ 'partnerId', '0.4231' ], ... ]
      return (rawResults || []).map((item) => ({
        partnerId: item[0],
        distanceKm: parseFloat(item[1]),
      }));
    } catch (err) {
      console.warn('[Redis GEOSEARCH error, falling back to in-memory]:', err.message);
    }
  }

  // In-memory fallback
  const results = [];
  for (const [partnerId, data] of inMemoryPartners.entries()) {
    if (data.online) {
      const distance = haversineDistanceKm(lat, lng, data.lat, data.lng);
      if (distance <= radiusKm) {
        results.push({ partnerId, distanceKm: distance });
      }
    }
  }
  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── JWT Authentication Middleware (Placeholder) ─────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // For easy testing / development allow anonymous if simulated
    if (process.env.NODE_ENV === 'development' || req.query.dev === 'true' || req.headers['x-dev-mode']) {
      req.user = { id: req.body.partnerId || req.body.clientId || 'dev-user', role: 'partner' };
      return next();
    }
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // In dev mode allow expired/placeholder tokens
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'mock-user', role: 'partner' };
      return next();
    }
    return res.status(401).json({ success: false, error: 'Invalid or expired JWT token' });
  }
}

// ── Socket.IO Handlers ──────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Partner Registration with Socket
  socket.on('partner:register', ({ partnerId, token }) => {
    if (!partnerId) return;

    if (!partnerSockets.has(partnerId)) {
      partnerSockets.set(partnerId, new Set());
    }
    partnerSockets.get(partnerId).add(socket.id);
    socketToPartner.set(socket.id, partnerId);
    socket.join(`partner:${partnerId}`);

    console.log(`[Socket] Partner registered: ${partnerId} (socket: ${socket.id})`);
    socket.emit('partner:registered', { success: true, partnerId });
  });

  // Partner Location Streaming / Heartbeat via Socket
  socket.on('partner:location:update', async ({ partnerId, lat, lng }) => {
    if (!partnerId || lat == null || lng == null) return;

    inMemoryPartners.set(partnerId, { lat, lng, online: true, updatedAt: Date.now() });

    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.geoadd('partners:online', lng, lat, partnerId);
        await redisClient.hset(`partner:${partnerId}`, {
          lat,
          lng,
          online: 'true',
          lastSeen: Date.now().toString(),
        });
      } catch (err) {
        console.error('[Redis GEOADD Socket Error]:', err.message);
      }
    }
  });

  // Client subscribes to booking updates
  socket.on('client:subscribe', ({ bookingId }) => {
    if (bookingId) {
      socket.join(`booking:${bookingId}`);
      console.log(`[Socket] Subscribed to booking room: booking:${bookingId}`);
    }
  });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    const partnerId = socketToPartner.get(socket.id);
    if (partnerId) {
      const sockets = partnerSockets.get(partnerId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          partnerSockets.delete(partnerId);
        }
      }
      socketToPartner.delete(socket.id);
      console.log(`[Socket] Partner ${partnerId} disconnected (socket: ${socket.id})`);
    }
  });
});

// ── HTTP Endpoints ──────────────────────────────────────────────────────────

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    redisConnected: isRedisAvailable,
    onlineSocketPartners: Array.from(partnerSockets.keys()),
    activeBookingsCount: activeBookings.size,
  });
});

// Dev JWT Token Generator Endpoint
app.post('/auth/dev-token', (req, res) => {
  const { id = 'partner-001', role = 'partner' } = req.body;
  const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token });
});

// Partner Goes Online / Updates Location
app.post('/partner/location', async (req, res) => {
  const { partnerId, lat, lng, online = true } = req.body;

  if (!partnerId || lat == null || lng == null) {
    return res.status(400).json({ success: false, error: 'Missing partnerId, lat, or lng' });
  }

  inMemoryPartners.set(partnerId, {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    online: Boolean(online),
    updatedAt: Date.now(),
  });

  if (isRedisAvailable && redisClient) {
    try {
      if (online) {
        await redisClient.geoadd('partners:online', lng, lat, partnerId);
        await redisClient.hset(`partner:${partnerId}`, {
          lat: lat.toString(),
          lng: lng.toString(),
          online: 'true',
          lastSeen: Date.now().toString(),
        });
      } else {
        await redisClient.zrem('partners:online', partnerId);
        await redisClient.hset(`partner:${partnerId}`, 'online', 'false');
      }
    } catch (err) {
      console.error('[Redis GEOADD Error]:', err.message);
    }
  }

  return res.json({
    success: true,
    partnerId,
    location: { lat, lng },
    online: Boolean(online),
  });
});

// Partner Status Toggle (Online/Offline)
app.post('/partner/status', async (req, res) => {
  const { partnerId, online } = req.body;
  if (!partnerId) {
    return res.status(400).json({ success: false, error: 'partnerId required' });
  }

  const existing = inMemoryPartners.get(partnerId) || { lat: 0, lng: 0 };
  inMemoryPartners.set(partnerId, { ...existing, online: Boolean(online), updatedAt: Date.now() });

  if (isRedisAvailable && redisClient) {
    try {
      if (online && existing.lat && existing.lng) {
        await redisClient.geoadd('partners:online', existing.lng, existing.lat, partnerId);
        await redisClient.hset(`partner:${partnerId}`, 'online', 'true');
      } else {
        await redisClient.zrem('partners:online', partnerId);
        await redisClient.hset(`partner:${partnerId}`, 'online', 'false');
      }
    } catch (err) {
      console.error('[Redis Status Update Error]:', err.message);
    }
  }

  res.json({ success: true, partnerId, online: Boolean(online) });
});

// Client Creates Booking & Initiates Proximity Dispatch Loop
app.post(['/bookings', '/api/bookings'], async (req, res) => {
  const { lat, lng, service, amount, partnerEarning, clientName, clientId } = req.body;

  if (lat == null || lng == null) {
    return res.status(400).json({ success: false, error: 'Pickup lat and lng are required' });
  }

  const bookingId = uuidv4();
  const booking = {
    bookingId,
    clientId: clientId || 'client-anon',
    clientName: clientName || 'Guest Client',
    clientLat: parseFloat(lat),
    clientLng: parseFloat(lng),
    service: service || 'Instagram Reel Shoot (60 min)',
    amount: amount || 499,
    partnerEarning: partnerEarning || 350,
    status: 'SEARCHING_PARTNER',
    createdAt: new Date().toISOString(),
    assignedPartnerId: null,
  };

  activeBookings.set(bookingId, booking);

  // Trigger dispatch waterfall asynchronously
  dispatchBookingWaterfall(booking).catch((err) => {
    console.error(`[Dispatch Error for ${bookingId}]:`, err);
  });

  res.json({
    success: true,
    bookingId,
    status: booking.status,
    message: 'Booking created. Dispatching to nearest available partner...',
  });
});

// Get Booking Status
app.get(['/bookings/:id', '/api/bookings/:id'], (req, res) => {
  const booking = activeBookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  res.json({ success: true, booking });
});

// Partner Accepts Booking Offer
app.post('/partner/bookings/:id/accept', async (req, res) => {
  const bookingId = req.params.id;
  const { partnerId } = req.body;

  if (!partnerId) {
    return res.status(400).json({ success: false, error: 'partnerId is required' });
  }

  const callbackKey = `${bookingId}:${partnerId}`;
  const cb = acceptanceCallbacks.get(callbackKey);

  if (!cb) {
    return res.status(410).json({
      success: false,
      error: 'Offer expired, already accepted, or reallocated to another partner',
    });
  }

  // Resolve dispatch promise
  cb.resolve({ accepted: true, partnerId });
  acceptanceCallbacks.delete(callbackKey);

  res.json({
    success: true,
    status: 'ACCEPTED',
    bookingId,
    partnerId,
    message: 'Booking successfully accepted and assigned!',
  });
});

// Partner Rejects Booking Offer (Immediately triggers fallback to next partner)
app.post('/partner/bookings/:id/reject', async (req, res) => {
  const bookingId = req.params.id;
  const { partnerId, reason } = req.body;

  const callbackKey = `${bookingId}:${partnerId}`;
  const cb = acceptanceCallbacks.get(callbackKey);

  if (cb) {
    console.log(`[Dispatch] Partner ${partnerId} explicitly rejected booking ${bookingId}. Reason: ${reason || 'None'}`);
    cb.resolve({ accepted: false, reason: reason || 'REJECTED' });
    acceptanceCallbacks.delete(callbackKey);
  }

  res.json({ success: true, message: 'Rejection acknowledged. Next partner will be notified.' });
});

// ── Automated Proximity Dispatch Engine (20s Waterfall) ────────────────────
async function dispatchBookingWaterfall(booking) {
  const { bookingId, clientLat, clientLng } = booking;
  console.log(`[Dispatch] Starting nearest-partner search for booking ${bookingId} at (${clientLat}, ${clientLng})`);

  // 1. Search for online partners within 5 km (sorted ascending by distance)
  const nearby = await findNearbyPartners(clientLat, clientLng, 5);

  if (!nearby.length) {
    console.log(`[Dispatch] No nearby online partners found within 5km for booking ${bookingId}`);
    booking.status = 'NO_PARTNERS_AVAILABLE';
    io.to(`booking:${bookingId}`).emit('booking:status', { bookingId, status: 'NO_PARTNERS_AVAILABLE' });
    return;
  }

  console.log(`[Dispatch] Found ${nearby.length} nearby candidate(s) for booking ${bookingId}:`, nearby);

  // 2. Iterate through partners sequentially (Nearest -> 2nd Nearest -> ...)
  for (const candidate of nearby) {
    const { partnerId, distanceKm } = candidate;

    // Check if partner has active Socket.IO connection
    const socketSet = partnerSockets.get(partnerId);
    if (!socketSet || socketSet.size === 0) {
      console.log(`[Dispatch] Partner ${partnerId} is nearby but not connected via Socket.IO. Skipping...`);
      continue;
    }

    console.log(`[Dispatch] 🚀 Dispatching booking ${bookingId} to nearest partner ${partnerId} (~${distanceKm.toFixed(2)} km)`);

    booking.currentOfferedPartnerId = partnerId;

    // Emit real-time offer to all sockets of this partner
    const offerPayload = {
      bookingId: booking.bookingId,
      clientName: booking.clientName,
      clientLat: booking.clientLat,
      clientLng: booking.clientLng,
      service: booking.service,
      amount: booking.amount,
      earning: booking.partnerEarning,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      timeoutSec: 20,
      timestamp: Date.now(),
    };

    socketSet.forEach((socketId) => {
      io.to(socketId).emit('booking_request', offerPayload);
      io.to(socketId).emit('booking:offer', offerPayload);
    });

    // Notify client that partner is being pinged
    io.to(`booking:${bookingId}`).emit('booking:status', {
      bookingId,
      status: 'OFFERED_TO_PARTNER',
      partnerDistanceKm: distanceKm.toFixed(2),
    });

    // Wait up to 20 seconds for partner to accept
    const result = await waitForAcceptance(bookingId, partnerId, DISPATCH_TIMEOUT_MS);

    if (result && result.accepted) {
      console.log(`[Dispatch] ✅ Booking ${bookingId} ACCEPTED by partner ${partnerId}!`);
      booking.status = 'CONFIRMED';
      booking.assignedPartnerId = partnerId;
      booking.assignedAt = new Date().toISOString();

      // Emit assignment to partner and client
      io.to(`partner:${partnerId}`).emit('booking:assigned', { bookingId, booking });
      io.to(`booking:${bookingId}`).emit('booking:partner-assigned', {
        bookingId,
        partnerId,
        booking,
      });

      return;
    }

    console.log(`[Dispatch] ⏱️ Timeout / Rejection for partner ${partnerId} on booking ${bookingId}. Escalating to next nearest partner...`);

    // Notify partner that offer has expired / was revoked
    socketSet.forEach((socketId) => {
      io.to(socketId).emit('booking:offer_expired', { bookingId });
    });
  }

  // All candidates exhausted
  console.log(`[Dispatch] ❌ No partner accepted booking ${bookingId} after waterfall search.`);
  booking.status = 'UNASSIGNED';
  io.to(`booking:${bookingId}`).emit('booking:status', {
    bookingId,
    status: 'UNASSIGNED',
    message: 'All nearby partners were busy or timed out. Please try again shortly.',
  });
}

function waitForAcceptance(bookingId, partnerId, timeoutMs) {
  return new Promise((resolve) => {
    const callbackKey = `${bookingId}:${partnerId}`;

    const timer = setTimeout(() => {
      acceptanceCallbacks.delete(callbackKey);
      resolve({ accepted: false, reason: 'TIMEOUT' });
    }, timeoutMs);

    acceptanceCallbacks.set(callbackKey, {
      resolve: (val) => {
        clearTimeout(timer);
        resolve(val);
      },
    });
  });
}

// ── Start Server ────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 ORBIT Partner Dispatch Engine Running on Port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://0.0.0.0:${PORT}`);
  console.log(`📍 Redis GEO store: ${REDIS_URL} (Status: ${isRedisAvailable ? 'Connected' : 'In-Memory Fallback'})`);
  console.log(`=======================================================`);
});
