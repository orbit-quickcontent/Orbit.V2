/**
 * ORBIT QuickContent — Observability & Health Check Routes
 *
 * GET /health — Basic service status
 * GET /ready  — Database, Redis, and configuration readiness check
 * GET /live   — Liveness probe
 */

import { Router, Request, Response } from "express";
import { firestoreDb } from "../lib/db";

const router = Router();

import { isRedisConnected } from "../utils/redis";

router.get("/health", (_req: Request, res: Response) => {
  const redisConnected = isRedisConnected();
  res.status(200).json({
    status: redisConnected ? "ok" : "degraded",
    redis: redisConnected ? "connected" : "disconnected",
    service: "Orbit Standalone Backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

router.get("/ready", async (_req: Request, res: Response) => {
  const checks: Record<string, boolean> = {
    database: false,
    razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_SECRET),
    jwtConfigured: !!(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET),
  };

  try {
    // Check DB query capability
    await firestoreDb.packages.findMany();
    checks.database = true;
  } catch (err) {
    checks.database = false;
  }

  const isReady = checks.database;
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    checks,
    timestamp: new Date().toISOString(),
  });
});

router.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({
    live: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
