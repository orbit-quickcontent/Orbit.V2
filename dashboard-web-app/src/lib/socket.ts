import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3003";

let socketInstance: Socket | null = null;

/**
 * Get or initialize the Socket.IO client instance with auth handshake,
 * auto-reconnect, exponential backoff, and connection timeout configuration.
 */
export function getSocket(): Socket {
  if (!socketInstance) {
    const token = typeof window !== "undefined" ? localStorage.getItem("orbit_token") : null;

    socketInstance = io(WS_URL, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: token || "",
      },
    });

    socketInstance.on("connect", () => {
      console.log(`[Socket.IO] Connected to WS server (${WS_URL}) with ID: ${socketInstance?.id}`);
    });

    socketInstance.on("connect_error", (error) => {
      console.warn("[Socket.IO] Connection error:", error.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`);
    });
  }

  return socketInstance;
}

/**
 * Subscribe client to a specific booking room.
 */
export function subscribeToBooking(bookingId: string, onUpdate: (data: any) => void): () => void {
  const socket = getSocket();
  socket.emit("client:subscribe", { bookingId });

  const statusHandler = (data: any) => onUpdate(data);
  const syncHandler = (data: any) => onUpdate(data);

  socket.on("booking:status-update", statusHandler);
  socket.on("booking:sync-update", syncHandler);

  return () => {
    socket.off("booking:status-update", statusHandler);
    socket.off("booking:sync-update", syncHandler);
  };
}
