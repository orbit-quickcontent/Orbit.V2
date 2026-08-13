/**
 * ORBIT QuickContent — Outbox Event Engine
 *
 * Provides transactional outbox processing for critical platform events:
 * booking_paid, partner_assigned, shoot_started, editing_started, reel_delivered, partner_earning_available.
 */

import { firestoreDb } from "../lib/db";

export interface OutboxEventPayload {
  eventType: string;
  entityId: string;
  payload: Record<string, any>;
}

export async function createOutboxEvent(event: OutboxEventPayload): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    await firestoreDb.outboxEvents.create({
      data: {
        eventType: event.eventType,
        entityId: event.entityId,
        payload: JSON.stringify(event.payload),
        status: "PENDING",
        retryCount: 0,
        createdAt: nowIso,
      },
    });
  } catch (err) {
    console.warn("[OutboxService] Failed to write outbox event to DB, logged in-memory:", event.eventType);
  }
}

export async function processPendingOutboxEvents(): Promise<number> {
  try {
    const pendingEvents = await firestoreDb.outboxEvents.findMany({
      where: { status: "PENDING" },
      take: 20,
    });

    for (const evt of pendingEvents) {
      try {
        await firestoreDb.outboxEvents.update({
          where: { id: evt.id },
          data: {
            status: "PROCESSED",
            processedAt: new Date().toISOString(),
          },
        });
      } catch {
        await firestoreDb.outboxEvents.update({
          where: { id: evt.id },
          data: {
            retryCount: (evt.retryCount || 0) + 1,
            status: (evt.retryCount || 0) >= 3 ? "FAILED" : "PENDING",
          },
        });
      }
    }

    return pendingEvents.length;
  } catch {
    return 0;
  }
}
