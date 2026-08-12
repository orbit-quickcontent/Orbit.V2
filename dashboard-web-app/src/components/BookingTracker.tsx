"use client";

import React, { useEffect, useState } from "react";
import { Clock, CheckCircle2, Video, Sparkles } from "lucide-react";

export interface BookingTrackerProps {
  bookingId: string;
  status: string;
  targetCompletionTimeIso?: string; // e.g. 2026-08-07T18:00:00Z
  durationMinutes?: number; // total SLA duration, e.g. 90 mins
  deliveredAtIso?: string;
  reelUrl?: string;
}

export function BookingTracker({
  bookingId,
  status,
  targetCompletionTimeIso,
  durationMinutes = 90,
  deliveredAtIso,
  reelUrl,
}: BookingTrackerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [formattedTargetTime, setFormattedTargetTime] = useState<string>("");

  useEffect(() => {
    if (status === "DELIVERED") return;

    // Calculate target completion time if not provided
    const targetDate = targetCompletionTimeIso
      ? new Date(targetCompletionTimeIso)
      : new Date(Date.now() + durationMinutes * 60 * 1000);

    setFormattedTargetTime(
      targetDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((targetDate.getTime() - now) / 1000));
      setSecondsRemaining(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetCompletionTimeIso, durationMinutes, status]);

  if (status === "DELIVERED") {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-2xl text-emerald-300 flex items-center space-x-4 shadow-lg">
        <div className="p-3 bg-emerald-500/20 rounded-xl">
          <CheckCircle2 size={24} className="text-emerald-400" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white">Reel Delivered Successfully!</h4>
          <p className="text-xs text-emerald-400 mt-0.5">
            Delivered on {deliveredAtIso ? new Date(deliveredAtIso).toLocaleString() : "Just now"}
          </p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const totalSeconds = durationMinutes * 60;
  const elapsedSeconds = totalSeconds - secondsRemaining;
  const progressPct = Math.min(100, Math.max(5, Math.round((elapsedSeconds / totalSeconds) * 100)));

  return (
    <div className="bg-[#0B0F19] border border-cyan-950 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-cyan-400 animate-pulse" size={18} />
          <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Live Delivery Status</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
          Status: {status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <h3 className="text-2xl font-black text-white">
          Your reel arrives by <span className="text-cyan-400">{formattedTargetTime || "soon"}</span>
        </h3>
        <div className="flex items-center space-x-1.5 text-amber-400 font-mono font-bold text-lg">
          <Clock size={16} />
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden p-0.5 border border-gray-800">
        <div
          className="bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-gray-500 font-medium">
        <span>Assigned & Shooting</span>
        <span>Studio Editing</span>
        <span>Final 4K Delivery</span>
      </div>
    </div>
  );
}
