"use client";

import React, { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function SocketStatusBanner() {
  const [status, setStatus] = useState<"connected" | "reconnecting" | "offline">("connected");

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("offline");
    const onReconnectAttempt = () => setStatus("reconnecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    if (socket.connected) {
      setStatus("connected");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, []);

  if (status === "connected") return null; // Hide when healthy

  return (
    <div
      className={`w-full py-2 px-4 text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
        status === "reconnecting"
          ? "bg-amber-500/90 text-black"
          : "bg-red-600 text-white"
      }`}
    >
      {status === "reconnecting" ? (
        <>
          <RefreshCw size={14} className="animate-spin" />
          <span>Reconnecting to Orbit Realtime Network...</span>
        </>
      ) : (
        <>
          <WifiOff size={14} />
          <span>Offline Mode — Attempting to restore connection...</span>
        </>
      )}
    </div>
  );
}
