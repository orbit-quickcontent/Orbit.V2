import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/api.router';
import { initWebSocketService } from './services/websocket.service';

// Load environment variables
dotenv.config();

// Sentry Error Monitoring & Structured Logging setup
if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
    console.log('[Sentry] Backend monitoring initialized.');
  } catch (err) {
    console.warn('[Sentry] @sentry/node load notice:', (err as Error).message);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable production CORS
const allowedOrigins = [
  'https://orbit-quickcontent.com',
  'https://www.orbit-quickcontent.com',
  'https://app.orbit-quickcontent.com',
  'https://api.orbit-quickcontent.com',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev/fallback
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'api-key', 'accept'],
  credentials: true,
}));

// Health check endpoint for Docker & load balancer
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

import { validatePresignedToken } from './lib/security';

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[API-Request] ${req.method} ${req.url}`);
  const originalJson = res.json;
  res.json = function (body) {
    console.log(`[API-Response] ${req.method} ${req.url} -> Status ${res.statusCode} (Body: ${JSON.stringify(body).slice(0, 200)})`);
    return originalJson.apply(this, arguments as any);
  };
  next();
});

// Secure uploads middleware enforcing 15-minute presigned tokens for video streams/downloads
const secureUploadsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = (req.query.token as string) || null;
  const expires = (req.query.expires as string) || null;
  
  // Clean url path (remove query params) and build canonical path relative to /upload/reels
  const cleanPath = req.path;
  const fullUrlPath = `/upload/reels${cleanPath}`;

  if (!validatePresignedToken(fullUrlPath, token, expires)) {
    return res.status(403).json({ error: "Access Denied: Invalid or Expired Presigned URL Token." });
  }
  next();
};

app.use('/upload/reels', secureUploadsMiddleware, express.static(path.join(__dirname, '../../dashboard-web-app/public/upload/reels')));
app.use('/upload', express.static(path.join(__dirname, '../../dashboard-web-app/public/upload')));

// Mount main unified API routes
app.use('/api', apiRouter);

// Start WebSocket server on port 3003
const wsService = initWebSocketService();

// Start HTTP REST server on port 5000 (0.0.0.0 for emulator/LAN access)
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[API] Standalone REST API server running on http://0.0.0.0:${PORT}`);
});
