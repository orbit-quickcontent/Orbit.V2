import express from "express";
import { createServer as createHttpServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import apiRouter from "./routes/api.router";
import { initWebSocketService } from "./services/websocket.service";
import { validateEnv } from "./lib/env-validator";
import { requestLogger, logger } from "./lib/logger";

// 1. Load environment variables
dotenv.config();

// 2. Validate environment schema on startup (server halts if required vars are missing)
validateEnv();

// 3. Sentry Error Monitoring setup
if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
  try {
    const Sentry = require("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
    logger.info("[Sentry] Backend monitoring initialized.");
  } catch (err) {
    logger.warn({ error: (err as Error).message }, "[Sentry] @sentry/node load notice");
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// 4. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for REST API server to allow S3/WebSocket media origins
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 5. Enable CORS for configured frontend origins
const allowedOrigins = [
  "https://orbit-quickcontent.com",
  "https://www.orbit-quickcontent.com",
  "https://app.orbit-quickcontent.com",
  "https://api.orbit-quickcontent.com",
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5000",
  "http://10.0.2.2:5000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === "development" || origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Idempotency-Key", "X-Idempotency-Key", "x-idempotency-key", "api-key", "accept"],
    credentials: true,
  })
);

// 6. Request Logger Middleware (Pino JSON logger + Request ID)
app.use(requestLogger);

// 7. Health check endpoints (Root GET/HEAD for Cloud Render/Railway probes + /health)
app.all("/", (_req, res) => {
  res.status(200).json({
    name: "ORBIT Standalone Backend API",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

import { validatePresignedToken } from "./lib/security";

// 8. Secure static uploads middleware enforcing presigned tokens for reels
const secureUploadsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = (req.query.token as string) || null;
  const expires = (req.query.expires as string) || null;

  const cleanPath = req.path;
  const fullUrlPath = `/upload/reels${cleanPath}`;

  if (!validatePresignedToken(fullUrlPath, token, expires)) {
    return res.status(403).json({ error: "Access Denied: Invalid or Expired Presigned URL Token." });
  }
  next();
};

app.use("/upload/reels", secureUploadsMiddleware, express.static(path.join(__dirname, "../../dashboard-web-app/public/upload/reels")));
app.use("/upload", express.static(path.join(__dirname, "../../dashboard-web-app/public/upload")));

// 9. Mount main unified API routes
app.use("/api", apiRouter);

// 10. Create unified HTTP server
const httpServer = createHttpServer(app);

// 11. Attach WebSocket service to unified HTTP server
initWebSocketService(httpServer);

// 12. Start unified REST API & WebSocket server on PORT
httpServer.listen(Number(PORT), "0.0.0.0", () => {
  logger.info(`[API + WS] Unified REST & WebSocket server running on http://0.0.0.0:${PORT}`);
});
