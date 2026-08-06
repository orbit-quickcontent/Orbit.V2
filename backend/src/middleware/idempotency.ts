import { Request, Response, NextFunction } from "express";
import { firestoreDb } from "../lib/db";

const IDEMPOTENCY_COLLECTION = "idempotencyKeys";
const EXPIRATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function requireIdempotency(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["idempotency-key"] as string | undefined;

  if (!key) {
    res.status(400).json({ error: "Missing required header: Idempotency-Key" });
    return;
  }

  const userId = req.user?.id || "anonymous";
  const idempotencyDocId = `${userId}_${key}`;

  (async () => {
    try {
      // 1. Check if key exists in Firestore
      const existing = await firestoreDb.custom(IDEMPOTENCY_COLLECTION).findUnique({
        where: { id: idempotencyDocId },
      });

      if (existing) {
        const createdAt = new Date(existing.createdAt).getTime();
        const now = Date.now();

        // Expire key if older than 24h
        if (now - createdAt < EXPIRATION_TTL_MS) {
          console.log(`[Idempotency] Replaying cached response for key: ${key}`);
          res.setHeader("X-Cache-Replay", "true");
          res.status(existing.statusCode || 200).json(existing.responseData);
          return;
        }
      }

      // 2. Intercept res.json to capture response payload
      const originalJson = res.json.bind(res);
      res.json = (body: any): Response => {
        // Save to Firestore asynchronously
        firestoreDb
          .custom(IDEMPOTENCY_COLLECTION)
          .create({
            data: {
              id: idempotencyDocId,
              userId,
              key,
              statusCode: res.statusCode,
              responseData: body,
              createdAt: new Date().toISOString(),
            },
          })
          .catch((err) => {
            console.error("[Idempotency] Failed to store response key:", err);
          });

        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error("[Idempotency] Middleware error:", err);
      next();
    }
  })();
}
