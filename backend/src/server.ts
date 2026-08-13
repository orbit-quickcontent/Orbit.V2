import express from "express";
import { createServer as createHttpServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import apiRouter from "./routes/api.router";
import { initWebSocketService } from "./services/websocket.service";
import { startDispatchTimeoutWorker } from "./services/dispatch.service";
import { validateEnv } from "./lib/env-validator";
import { requestLogger, logger } from "./lib/logger";
import { validatePresignedToken } from "./lib/security";

dotenv.config();
validateEnv();

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

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

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

app.use(requestLogger);

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

app.use(
  "/upload/reels",
  secureUploadsMiddleware,
  express.static(path.join(__dirname, "../../dashboard-web-app/public/upload/reels"))
);

// Local filesystem uploads are development-only. Production uses signed Firebase URLs.
if (process.env.NODE_ENV !== "production" && process.env.LOCAL_UPLOADS_ENABLED !== "false") {
  app.use("/upload", express.static(path.join(__dirname, "../../dashboard-web-app/public/upload")));
}

app.use("/api", apiRouter);

const httpServer = createHttpServer(app);
initWebSocketService(httpServer);
startDispatchTimeoutWorker();

httpServer.listen(Number(PORT), "0.0.0.0", () => {
  logger.info(`[API + WS] Unified REST & WebSocket server running on http://0.0.0.0:${PORT}`);
});
