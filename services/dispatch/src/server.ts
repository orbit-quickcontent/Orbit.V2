import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { initSocketServer } from './socket';
import bookingsRouter from './routes/bookings';
import healthRouter from './routes/health';
import { redis } from './redis';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
const server = http.createServer(app);

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Rate Limiting Middleware (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' }
});

app.use('/api/', apiLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[HTTP ${req.method}] ${req.url} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
  next();
});

// Register Routes
app.use('/', healthRouter);
app.use('/api/bookings', bookingsRouter);

// Initialize Socket.IO Server
initSocketServer(server);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Express Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ORBIT Dispatch Engine running in [${NODE_ENV}] mode`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`\n[Shutdown] Received ${signal}. Closing HTTP & WebSocket servers...`);
  server.close(async () => {
    console.log('[Shutdown] HTTP server closed.');
    try {
      await redis.quit();
      console.log('[Shutdown] Redis connection cleanly closed.');
    } catch (err) {
      console.error('[Shutdown] Error disconnecting Redis:', err);
    }
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('[Shutdown] Forcefully terminating process after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
