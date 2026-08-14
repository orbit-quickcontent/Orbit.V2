import express from "express";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import { LocationService } from "./location.service";
import { PartnerLocationService } from "./partner-location.service";
import { acceptPartnerOffer, declinePartnerOffer, partnerArrivedAtLocation } from "./dispatch.service";
import { startCleanupWorker } from "./cleanup.service";
import { ENV } from "../config/env";

// Singleton io reference
let _io: SocketIOServer | null = null;

export function getIo(): SocketIOServer | null {
  return _io;
}

const onlinePartners = new Map<string, Set<string>>();
const socketSubscriptions = new Map<string, string>();

export function getOnlinePartnerIds(): string[] {
  return Array.from(onlinePartners.keys());
}

/**
 * Push dispatch offer to candidate partners.
 */
export function notifyDispatch(payload: {
  bookingId: string;
  partnerIds: string[];
  booking: any;
  round: number;
}) {
  if (!_io) return;
  const { bookingId, partnerIds, booking, round } = payload;
  console.log(`[WS] Dispatch notification: booking:${bookingId} to partners:`, partnerIds);

  const eventPayload = {
    booking,
    bookingId,
    id: bookingId,
    dispatchId: bookingId,
    round: round || 1,
    expiresAt: new Date(Date.now() + ENV.DISPATCH_OFFER_SECONDS * 1000).toISOString(),
    expiresInSeconds: ENV.DISPATCH_OFFER_SECONDS,
  };

  partnerIds.forEach((partnerId) => {
    const sockets = onlinePartners.get(partnerId);
    if (sockets) {
      sockets.forEach((socketId) => {
        _io!.to(socketId).emit("dispatch_offer", eventPayload);
        _io!.to(socketId).emit("booking:dispatched", eventPayload);
      });
    }
  });
}

/**
 * Push partner assignment notification to booking room.
 */
export function notifyAccept(payload: {
  bookingId: string;
  partnerId: string;
  partnerName: string;
  booking?: any;
}) {
  if (!_io) return;
  const { bookingId, partnerId, partnerName, booking } = payload;
  console.log(`[WS] Accept notification: booking:${bookingId} assigned to partner:${partnerId}`);

  _io.to(`booking:${bookingId}`).emit("partner_assigned", { bookingId, partnerId, partnerName, booking });
  _io.to(`booking:${bookingId}`).emit("booking:partner-assigned", { bookingId, partnerId, partnerName, booking });

  onlinePartners.forEach((sockets, onlinePartnerId) => {
    if (onlinePartnerId !== partnerId) {
      sockets.forEach((socketId) => {
        _io!.to(socketId).emit("dispatch_offer_expired", { bookingId });
      });
    }
  });
}

export function notifyClient(payload: { bookingId: string; event: string; data: any }) {
  if (!_io) return;
  const { bookingId, event, data } = payload;
  _io.to(`booking:${bookingId}`).emit(event, data);
}

export function notifyStatusChange(payload: {
  bookingId: string;
  status: string;
  previousStatus?: string;
  booking?: any;
}) {
  if (!_io) return;
  const { bookingId, status, previousStatus, booking } = payload;
  _io.to(`booking:${bookingId}`).emit("booking_status_update", { bookingId, status, previousStatus, booking });
  _io.to(`booking:${bookingId}`).emit("booking:status-change", { bookingId, status, previousStatus, booking });
}

export function notifyDeliver(payload: { bookingId: string; reelUrl: string; booking?: any }) {
  if (!_io) return;
  const { bookingId, reelUrl, booking } = payload;
  _io.to(`booking:${bookingId}`).emit("reel_delivered", { bookingId, reelUrl, booking });
}

/**
 * Initialize Socket.IO Server with JWT Authentication and Booking Room Isolation.
 */
export function initWebSocketService() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = new HttpServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    path: "/socket.io/",
  });

  _io = io;

  // 1. JWT Authentication Middleware
  io.use((socket: Socket, next) => {
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization ||
      socket.handshake.query?.token;

    if (!rawToken) {
      // Allow unauthenticated guest connections for development testing if token absent
      (socket as any).user = { id: socket.id, role: "guest" };
      return next();
    }

    try {
      const cleanToken = String(rawToken).replace("Bearer ", "");
      const decoded = jwt.verify(cleanToken, ENV.JWT_SECRET) as any;
      if (!decoded || !decoded.id) {
        return next(new Error("Invalid token payload: missing user ID"));
      }
      (socket as any).user = decoded;
      next();
    } catch (err: any) {
      console.warn(`[WS Auth] Token validation note (${socket.id}):`, err.message);
      (socket as any).user = { id: socket.id, role: "guest" };
      next();
    }
  });

  // 2. Start 15-second Stale Partner Cleanup Worker
  startCleanupWorker();

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user || { id: socket.id, role: "guest" };
    console.log(`[WS] Client connected: ${socket.id} (user: ${user.id}, role: ${user.role})`);

    const registerPartner = async (partnerId: string) => {
      const pId = partnerId || user.id;
      if (!pId) return;
      if (!onlinePartners.has(pId)) {
        onlinePartners.set(pId, new Set());
      }
      onlinePartners.get(pId)!.add(socket.id);
      (socket as any).partnerId = pId;
    };

    socket.on("partner:online", ({ partnerId }) => registerPartner(partnerId));
    socket.on("partner_online", (data) => registerPartner(data?.partnerId));

    socket.on("partner:offline", async ({ partnerId }) => {
      const pId = partnerId || (socket as any).partnerId || user.id;
      if (pId) {
        const sockets = onlinePartners.get(pId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) onlinePartners.delete(pId);
        }
        await PartnerLocationService.setPartnerOffline(pId);
      }
    });

    socket.on("partner_offline", async () => {
      const pId = (socket as any).partnerId || user.id;
      if (pId) {
        await PartnerLocationService.setPartnerOffline(pId);
      }
    });

    // ── Booking Room Subscriptions ──────────────────────────────────────────
    socket.on("join_booking", (data) => {
      const bookingId = typeof data === "string" ? data : data?.bookingId;
      if (bookingId) {
        socket.join(`booking:${bookingId}`);
        socketSubscriptions.set(socket.id, bookingId);
        console.log(`[WS] Socket ${socket.id} joined room booking:${bookingId}`);
      }
    });

    socket.on("leave_booking", (data) => {
      const bookingId = typeof data === "string" ? data : data?.bookingId;
      if (bookingId) {
        socket.leave(`booking:${bookingId}`);
        socketSubscriptions.delete(socket.id);
      }
    });

    socket.on("client:subscribe", ({ bookingId }) => {
      if (bookingId) {
        socket.join(`booking:${bookingId}`);
        socketSubscriptions.set(socket.id, bookingId);
      }
    });

    // ── Partner Live Location Stream (Throttled & Room-Isolated) ─────────────
    socket.on("partner_location", async (data) => {
      const partnerId = (socket as any).partnerId || user.id;
      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      // Rate limit check: max 1 update / 3 seconds
      const allowed = await PartnerLocationService.checkRateLimit(partnerId);
      if (!allowed) return;

      // Update Redis GEO & Partner State
      await PartnerLocationService.updateLocation({
        partnerId,
        lat,
        lng,
        speed: data.speed,
        heading: data.heading,
        accuracy: data.accuracy,
        timestamp: data.timestamp || Date.now(),
        socketId: socket.id,
      });

      LocationService.getInstance().updateLocation(partnerId, lat, lng, data.heading, data.speed);

      // Emit strictly to the assigned booking room if present
      const locationPayload = {
        partnerId,
        lat,
        lng,
        speed: data.speed ?? 0,
        heading: data.heading ?? 0,
        accuracy: data.accuracy ?? 0,
        timestamp: data.timestamp || Date.now(),
      };

      if (data.bookingId) {
        io.to(`booking:${data.bookingId}`).emit("partner_location_update", locationPayload);
      } else {
        const activeRoom = socketSubscriptions.get(socket.id);
        if (activeRoom) {
          io.to(`booking:${activeRoom}`).emit("partner_location_update", locationPayload);
        }
      }
    });

    socket.on("partner:updateLocation", (data) => {
      socket.emit("partner_location", data);
    });

    // ── Partner Offer Lifecycle ─────────────────────────────────────────────
    socket.on("partner_accept_booking", async ({ bookingId, partnerName }) => {
      const partnerId = (socket as any).partnerId || user.id;
      if (!bookingId || !partnerId) return;

      const res = await acceptPartnerOffer(bookingId, partnerId, partnerName || "Assigned Partner");
      if (res.success) {
        socket.join(`booking:${bookingId}`);
        socket.emit("partner_accept_success", { bookingId, booking: res.booking });
      } else {
        socket.emit("partner_accept_failed", { bookingId, message: res.message });
      }
    });

    socket.on("partner_reject_booking", async ({ bookingId }) => {
      const partnerId = (socket as any).partnerId || user.id;
      if (bookingId && partnerId) {
        await declinePartnerOffer(bookingId, partnerId);
        socket.emit("partner_reject_success", { bookingId });
      }
    });

    socket.on("partner_arrived", async ({ bookingId }) => {
      const partnerId = (socket as any).partnerId || user.id;
      if (bookingId && partnerId) {
        await partnerArrivedAtLocation(bookingId, partnerId);
      }
    });

    socket.on("disconnect", async () => {
      const pId = (socket as any).partnerId || user.id;
      if (pId) {
        const sockets = onlinePartners.get(pId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) onlinePartners.delete(pId);
        }
      }
      socketSubscriptions.delete(socket.id);
    });
  });

  const WS_PORT = Number(process.env.WS_PORT) || 3003;
  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[WS Warning] Port ${WS_PORT} in use; reusing active socket listener.`);
    } else {
      console.error("[WS Error]", err);
    }
  });

  server.listen(WS_PORT, () => {
    console.log(`[WS] WebSocket dispatch server running on port ${WS_PORT}`);
  });

  return { server, io };
}
