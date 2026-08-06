import pino from "pino";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Express middleware attaching a unique Request ID (X-Request-ID header)
 * and structured JSON logging per request.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const latencyMs = Date.now() - startTime;
    const userId = req.user?.id || "anonymous";

    logger.info({
      requestId,
      userId,
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      latencyMs,
      userAgent: req.headers["user-agent"],
    });
  });

  next();
}
