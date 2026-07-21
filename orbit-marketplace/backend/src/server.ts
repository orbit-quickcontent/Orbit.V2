import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/api.router';
import { initWebSocketService } from './services/websocket.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'api-key', 'accept']
}));

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

// Start HTTP REST server on port 5000
app.listen(PORT, () => {
  console.log(`[API] Standalone REST API server running on port ${PORT}`);
});
