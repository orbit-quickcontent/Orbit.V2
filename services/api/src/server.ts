import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { globalRateLimiter } from './middleware/rateLimiter';
import partnerRoutes from './routes/partnerRoutes';
import bookingRoutes from './routes/bookingRoutes';
import authRoutes from './routes/authRoutes';
import { initSocketServer } from './services/socketService';
import { setupSwagger } from './swagger';
import { redis } from './config/redis';

const app = express();
const server = http.createServer(app);

// Security & Base Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(globalRateLimiter);

// OpenAPI Documentation
setupSwagger(app);

// API Routes
app.use('/api', partnerRoutes);
app.use('/api', bookingRoutes);
app.use('/api', authRoutes);

// Healthcheck
app.get('/health', async (_req, res) => {
  try {
    const redisPing = await redis.ping();
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      redis: redisPing === 'PONG' ? 'HEALTHY' : 'UNHEALTHY',
    });
  } catch (error) {
    res.status(500).json({ status: 'DOWN', error });
  }
});

// Initialize Socket.IO
initSocketServer(server);

const PORT = parseInt(env.PORT, 10) || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 ORBIT Real-Time Partner Tracking API listening on http://localhost:${PORT}`);
    console.log(`📚 Swagger documentation available at http://localhost:${PORT}/docs`);
  });
}

export { app, server };
