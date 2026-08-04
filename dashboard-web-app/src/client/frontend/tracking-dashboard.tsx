"use client";

/**
 * 🔵 CLIENT FRONTEND | TrackingDashboard
 *
 * Real-time booking tracking with animated status pipeline,
 * live stats, en-route location card, delivery celebration,
 * and star review section.
 *
 * Lifecycle:
 *  1. Active booking → auto-advance through pipeline
 *  2. DELIVERED → show "Download Reel" button
 *  3. User downloads → show "Task Completed" + Review
 *  4. User submits review → completeBooking() clears currentBooking
 *  5. All timers/polling stop. Navigating away and back shows
 *     "No Active Booking" with Browse Packages CTA.
 *
 * IMPORTANT: State is derived from currentBooking in the store so
 * navigating away and back does NOT restart the tracking process.
 *
 * Used by: client-app.tsx
 * Category: Client UI
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Film,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Navigation,
  Users,
  MapPin,
  Cloud,
  PartyPopper,
  Timer,
  CircleDot,
  Star,
  MessageSquare,
  Send,
  Download,
  CircleCheckBig,
  X,
  Loader2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/constants";
import { type BookingStatus } from "@/lib/types";
import { toast } from "sonner";
import { io } from "socket.io-client";

// ─── HLS Player with Adaptive Bitrate (ABR) and dynamic token parameters ───
interface HlsPlayerProps {
  src: string;
  poster?: string;
}

function HlsPlayer({ src, poster }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentQuality, setCurrentQuality] = useState<string>("Auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: any = null;

    if (src.includes(".m3u8")) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native ABR playing (Safari/iOS)
        video.src = src;
        setAvailableQualities(["Auto (Native)"]);
      } else {
        const Hls = (window as any).Hls;
        if (Hls && Hls.isSupported()) {
          hls = new Hls({
            xhrSetup: (xhr: XMLHttpRequest, url: string) => {
              // Append security token and expiry timestamp to all chunk segment requests
              const playlistUrl = new URL(src, window.location.href);
              const token = playlistUrl.searchParams.get("token");
              const expires = playlistUrl.searchParams.get("expires");
              if (token && expires && !url.includes("token=")) {
                const separator = url.includes("?") ? "&" : "?";
                xhr.open("GET", `${url}${separator}token=${token}&expires=${expires}`, true);
              }
            }
          });

          hls.loadSource(src);
          hls.attachMedia(video);
          hlsRef.current = hls;

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const levels = hls.levels;
            const qualities = ["Auto", ...levels.map((l: any) => `${l.height}p`)];
            setAvailableQualities(qualities);
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (event: any, data: any) => {
            const level = hls.levels[data.level];
            if (level) {
              console.log(`[ABR Stream] Switched quality level to: ${level.height}p`);
            }
          });
        } else {
          // Absolute fallback
          video.src = src;
        }
      }
    } else {
      // Non-HLS fallback (e.g. raw MP4)
      video.src = src;
      setAvailableQualities(["Original MP4"]);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);
    const hls = hlsRef.current;
    if (!hls) return;

    if (quality === "Auto") {
      hls.currentLevel = -1;
    } else {
      const height = parseInt(quality, 10);
      const levelIndex = hls.levels.findIndex((l: any) => l.height === height);
      if (levelIndex !== -1) {
        hls.currentLevel = levelIndex;
      }
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-black border border-orbit-cyan/20 orbit-glow mb-6 max-w-lg mx-auto">
      <video
        ref={videoRef}
        controls
        playsInline
        className="w-full aspect-video rounded-xl"
        poster={poster}
      />
      {availableQualities.length > 1 && (
        <div className="absolute top-3 right-3 z-20 flex gap-1">
          <select
            value={currentQuality}
            onChange={(e) => handleQualityChange(e.target.value)}
            className="bg-black/80 text-white text-[10px] font-bold border border-orbit-cyan/30 rounded px-2 py-1 select-none focus:outline-none focus:border-orbit-cyan cursor-pointer transition-all hover:bg-black"
          >
            {availableQualities.map((q) => (
              <option key={q} value={q} className="bg-black text-white">
                {q}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── Status Pipeline ────────────────────────────────────────────────────────────
export const STATUS_PIPELINE: { status: BookingStatus; label: string; icon: React.ReactNode; description: string }[] = [
  { status: "PAID", label: "Payment Confirmed", icon: <CreditCard className="w-5 h-5" />, description: "Payment verified. Dispatching partner..." },
  { status: "PARTNER_DISPATCHED", label: "Partner Dispatched", icon: <Users className="w-5 h-5" />, description: "Visual Architect assigned and notified." },
  { status: "EN_ROUTE", label: "En Route", icon: <Navigation className="w-5 h-5" />, description: "Partner navigating to your location." },
  { status: "SHOOTING", label: "Shooting", icon: <Camera className="w-5 h-5" />, description: "Capturing your cinematic footage." },
  { status: "SYNCING", label: "Syncing", icon: <Upload className="w-5 h-5" />, description: "Raw footage streaming to editing hub." },
  { status: "EDITING", label: "Editing", icon: <Film className="w-5 h-5" />, description: "Editors crafting your masterpiece." },
  { status: "DELIVERED", label: "Delivered", icon: <CheckCircle2 className="w-5 h-5" />, description: "Your cinematic reel is ready!" },
];

// ─── Star Rating Component ──────────────────────────────────────────────────────
function StarRating({ value, onChange, size = "md" }: { value: number; onChange: (v: number) => void; size?: "sm" | "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "w-5 h-5" : "w-7 h-7";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform duration-150 hover:scale-110 active:scale-95"
        >
          <Star
            className={`${sz} transition-colors duration-200 ${
              star <= (hovered || value)
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/25"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Review Section ──────────────────────────────────────────────────────────────
function ReviewSection({ bookingId, onReviewDone }: { bookingId: string; onReviewDone: () => void }) {
  const { submitReview, reviews } = useAppStore();
  const existingReview = reviews.find((r) => r.bookingId === bookingId);

  const [partnerRating, setPartnerRating] = useState(existingReview?.partnerRating ?? 0);
  const [editorRating, setEditorRating] = useState(existingReview?.editorRating ?? 0);
  const [feedback, setFeedback] = useState(existingReview?.feedback ?? "");
  const [submitted, setSubmitted] = useState(!!existingReview);

  const handleSubmit = useCallback(() => {
    if (partnerRating === 0 || editorRating === 0) return;
    submitReview({
      bookingId,
      partnerRating,
      editorRating,
      feedback: feedback.trim(),
    });
    setSubmitted(true);
    // After a short delay, complete the booking so currentBooking is cleared
    setTimeout(() => {
      onReviewDone();
    }, 1500);
  }, [bookingId, partnerRating, editorRating, feedback, submitReview, onReviewDone]);

  // If review already existed (user navigated back before timeout), complete now
  useEffect(() => {
    if (existingReview) {
      const timer = setTimeout(() => {
        onReviewDone();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [existingReview, onReviewDone]);

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="orbit-card rounded-2xl p-5 sm:p-6 border border-green-500/20"
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <h4 className="text-base font-bold text-foreground mb-1">Review Submitted!</h4>
          <p className="text-xs text-muted-foreground">Thanks for your feedback. It helps our partners and editors improve.</p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Partner</p>
              <div className="flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= partnerRating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Editor</p>
              <div className="flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= editorRating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="orbit-card rounded-2xl p-5 sm:p-6 border border-orbit-cyan/15"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/15 to-orange-500/15 flex items-center justify-center">
          <Star className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">Rate Your Experience</h4>
          <p className="text-[11px] text-muted-foreground">Help our partners & editors grow</p>
        </div>
      </div>

      {/* Partner Rating */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orbit-cyan" />
            <span className="text-xs font-semibold text-foreground">Partner / Videographer</span>
          </div>
          {partnerRating > 0 && (
            <span className="text-xs font-bold text-amber-400">{partnerRating}.0</span>
          )}
        </div>
        <StarRating value={partnerRating} onChange={setPartnerRating} />
      </div>

      {/* Editor Rating */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-orbit-purple" />
            <span className="text-xs font-semibold text-foreground">Editor</span>
          </div>
          {editorRating > 0 && (
            <span className="text-xs font-bold text-amber-400">{editorRating}.0</span>
          )}
        </div>
        <StarRating value={editorRating} onChange={setEditorRating} />
      </div>

      {/* Feedback Text */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Feedback (optional)</span>
        </div>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us about your experience..."
          className="bg-white/5 border-orbit-border focus:border-orbit-cyan/50 min-h-[72px] text-sm resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleSubmit}
          disabled={partnerRating === 0 || editorRating === 0}
          className="flex-1 bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold disabled:opacity-45"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Review
        </Button>
        <Button
          variant="outline"
          onClick={onReviewDone}
          className="flex-1 border-orbit-border text-foreground hover:bg-white/5 font-bold"
        >
          Skip & Close
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Tracking Dashboard ─────────────────────────────────────────────────────
export function TrackingDashboard() {
  const {
    currentBooking,
    setCurrentView,
    completeBooking,
    updateBookingStatus,
    updateSyncPercentage,
    updateEditCountdown,
    cancelBooking,
    markBookingDelivered,
    markBookingDownloaded,
  } = useAppStore();

  // ─── DERIVE state from currentBooking (persists across navigation) ──────
  const isComplete = useMemo(
    () => currentBooking?.status === "DELIVERED",
    [currentBooking?.status]
  );

  const isDownloaded = useMemo(
    () => !!(currentBooking?.downloaded && currentBooking?.status === "DELIVERED"),
    [currentBooking?.downloaded, currentBooking?.status]
  );

  // activeStep is derived from booking status — never resets on navigation
  const activeStep = useMemo(() => {
    if (!currentBooking) return 0;
    const status = currentBooking.status === "READY_TO_EDIT" ? "EDITING" : currentBooking.status;
    const idx = STATUS_PIPELINE.findIndex((s) => s.status === status);
    return idx >= 0 ? idx : 0;
  }, [currentBooking]);

  // ─── Local-only animated values (cosmetic, not persisted) ───────────
  const [syncProgress, setSyncProgress] = useState(0);
  const [countdown, setCountdown] = useState(90);
  const [hlsLoaded, setHlsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).Hls) {
        setHlsLoaded(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js";
      script.async = true;
      script.onload = () => {
        setHlsLoaded(true);
      };
      document.body.appendChild(script);
    }
  }, []);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  // Track if auto-advance has been started for this booking to avoid restarting
  const autoAdvanceStartedRef = useRef<string | null>(null);

  // ─── Stop all timers ──────────────────────────────────────
  const stopAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── Complete & clear the booking ─────────────────────────
  const handleReviewDone = useCallback(() => {
    if (currentBooking) {
      completeBooking(currentBooking.id);
      setCurrentView("landing");
    }
  }, [currentBooking, completeBooking, setCurrentView]);

  // ─── Main effect: setup WebSocket connection & updates ──────────────
  useEffect(() => {
    if (!currentBooking) return;

    // Initial load: fetch latest state from API
    const loadInitialState = async () => {
      try {
        const res = await fetch(`/api/bookings/${currentBooking.id}/track`);
        if (res.ok) {
          const data = await res.json();
          if (data.tracking) {
            if (data.tracking.syncPercentage !== undefined) {
              setSyncProgress(data.tracking.syncPercentage);
              updateSyncPercentage(currentBooking.id, data.tracking.syncPercentage);
            }
            if (data.tracking.editCountdown != null) {
              setCountdown(data.tracking.editCountdown);
              updateEditCountdown(currentBooking.id, data.tracking.editCountdown);
            }
            updateBookingStatus(currentBooking.id, data.tracking.status, {
              reelUrl: data.tracking.reelUrl,
              deliveredAt: data.tracking.deliveredAt,
              hlsPlaylistUrl: data.tracking.hlsPlaylistUrl,
              masterReelUrl: data.tracking.masterReelUrl,
            });
            if (data.tracking.status === "DELIVERED") {
              setSyncProgress(100);
              setCountdown(0);
            }
          }
        }
      } catch { /* fallback */ }
    };
    loadInitialState();

    // If already DELIVERED, no need for socket/polling
    if (currentBooking.status === "DELIVERED") {
      stopAllTimers();
      setSyncProgress(100);
      setCountdown(0);
      return;
    }

    // Setup Socket.IO connection
    const socket = io("/?XTransformPort=3003", {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("[WS Client] Connected, subscribing to booking:", currentBooking.id);
      socket.emit("client:subscribe", { bookingId: currentBooking.id });
    });

    socket.on("connect_error", (err) => {
      console.warn("[WS Client] Connection error:", err.message);
    });

    socket.on("booking:partner-assigned", (data: { bookingId: string; partnerId: string; partnerName: string }) => {
      console.log("[WS Client] Partner assigned:", data);
      toast.success("Videographer assigned!", {
        description: `${data.partnerName} is now handling your booking.`,
      });
      loadInitialState();
    });

    socket.on("booking:status-update", (data: { bookingId: string; status: BookingStatus; reelUrl?: string; hlsPlaylistUrl?: string; masterReelUrl?: string; deliveredAt?: string }) => {
      // Normalise READY_TO_EDIT → EDITING so the client pipeline step is correct
      const normStatus = (data.status as string) === "READY_TO_EDIT" ? "EDITING" as BookingStatus : data.status;
      console.log("[WS Client] Status update:", normStatus);
      updateBookingStatus(currentBooking.id, normStatus, {
        reelUrl: data.reelUrl,
        deliveredAt: data.deliveredAt,
        hlsPlaylistUrl: data.hlsPlaylistUrl,
        masterReelUrl: data.masterReelUrl,
      });
      
      if (normStatus === "EDITING") {
        setSyncProgress(100);
      }
      if (normStatus === "DELIVERED") {
        setSyncProgress(100);
        setCountdown(0);
        stopAllTimers();
        toast.success("🎬 Your reel is ready!", {
          description: "Head to the tracking tab to download your video.",
        });
      }
    });

    socket.on("booking:sync-update", (data: { bookingId: string; syncPercentage: number }) => {
      console.log("[WS Client] Sync progress update:", data.syncPercentage);
      setSyncProgress(data.syncPercentage);
      updateSyncPercentage(currentBooking.id, data.syncPercentage);
    });

    socket.on("booking:countdown-update", (data: { bookingId: string; editCountdown: number }) => {
      console.log("[WS Client] Countdown update:", data.editCountdown);
      setCountdown(data.editCountdown);
      updateEditCountdown(currentBooking.id, data.editCountdown);
    });

    // ── Polling fallback: refresh state every 10s in case WS events are missed ──
    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings/${currentBooking.id}/track`);
        if (res.ok) {
          const data = await res.json();
          if (data.tracking) {
            if (data.tracking.syncPercentage !== undefined) {
              setSyncProgress(data.tracking.syncPercentage);
              updateSyncPercentage(currentBooking.id, data.tracking.syncPercentage);
            }
            if (data.tracking.editCountdown != null) {
              setCountdown(data.tracking.editCountdown);
              updateEditCountdown(currentBooking.id, data.tracking.editCountdown);
            }
            updateBookingStatus(currentBooking.id, data.tracking.status, {
              reelUrl: data.tracking.reelUrl,
              deliveredAt: data.tracking.deliveredAt,
              hlsPlaylistUrl: data.tracking.hlsPlaylistUrl,
              masterReelUrl: data.tracking.masterReelUrl,
            });
            if (data.tracking.status === "DELIVERED") {
              clearInterval(pollTimer);
              setSyncProgress(100);
              setCountdown(0);
            }
          }
        }
      } catch { /* ignore poll errors */ }
    }, 10000);

    return () => {
      console.log("[WS Client] Disconnecting socket for booking:", currentBooking.id);
      socket.disconnect();
      clearInterval(pollTimer);
    };
  // Re-run when booking ID changes OR when status changes (e.g. DELIVERED arrives via store poll)
  }, [currentBooking?.id, currentBooking?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sync progress animation — ONLY during SYNCING phase ──────
  useEffect(() => {
    // Only animate sync progress during the SYNCING step (index 4)
    if (activeStep !== 4) {
      // If we've moved past syncing, set to 100%
      if (activeStep > 4) {
        Promise.resolve().then(() => setSyncProgress(100));
      }
      return;
    }

    // During SYNCING phase: animate from current to ~95%
    const iv = setInterval(() => {
      setSyncProgress((p) => {
        if (p >= 95) { clearInterval(iv); return 95; }
        return p + 1;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [activeStep]);

  // ─── When isComplete changes, finalize sync ──────────────────
  useEffect(() => {
    if (isComplete) {
      stopAllTimers();
      Promise.resolve().then(() => {
        setSyncProgress(100);
        setCountdown(0);
      });
    }
  }, [isComplete, stopAllTimers]);

  // ─── Countdown timer — only during EDITING phase ─────────────
  useEffect(() => {
    if (isComplete) return;
    if (activeStep !== 5) return; // Only during EDITING (index 5)
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 60000);
    return () => clearInterval(iv);
  }, [activeStep, isComplete]);

  // ─── Download handler ─────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (currentBooking) {
      if (currentBooking.reelUrl) {
        window.open(currentBooking.reelUrl, "_blank");
      }
      markBookingDelivered(currentBooking.id);
      markBookingDownloaded(currentBooking.id);
      if (currentBooking.reelUrl) {
        window.open(currentBooking.reelUrl, "_blank");
      }
    }
  }, [currentBooking, markBookingDelivered, markBookingDownloaded]);

  // ─── No Active Booking ────────────────────────────────────
  if (!currentBooking) {
    return (
      <section className="pt-2 sm:pt-4 pb-8 sm:pb-12 px-0 sm:px-4 flex items-center justify-center min-h-[50vh]">
        <motion.div
          className="text-center orbit-card rounded-2xl p-6 sm:p-10 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orbit-cyan/10 to-orbit-purple/10 flex items-center justify-center">
            <Cloud className="w-7 h-7 sm:w-8 sm:h-8 text-orbit-cyan" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">No Active Booking</h3>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm">
            Book a session to start tracking your edit in real-time.
          </p>
          <Button
            onClick={() => setCurrentView("packages")}
            className="bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold"
          >
            Browse Packages <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </section>
    );
  }

  const currentStatus = STATUS_PIPELINE[activeStep];

  // Determine if we're in the syncing phase (for stats card)
  const isSyncingPhase = activeStep === 4;

  return (
    <section className="pt-2 sm:pt-4 pb-8 sm:pb-12 px-0 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge variant="outline" className={`mb-3 ${
            isDownloaded
              ? "border-green-500/30 text-green-400 bg-green-500/5"
              : isComplete
              ? "border-amber-500/30 text-amber-400 bg-amber-500/5"
              : "border-orbit-cyan/30 text-orbit-cyan bg-orbit-cyan/5"
          }`}>
            {isDownloaded ? (
              <>
                <CircleCheckBig className="w-3.5 h-3.5 mr-1.5" />
                Completed
              </>
            ) : isComplete ? (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Ready to Download
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 mr-1.5" />
                Live Tracking
              </>
            )}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            {isDownloaded ? (
              <>Task <span className="text-gradient-orbit">Completed!</span></>
            ) : isComplete ? (
              <>Your Reel is <span className="text-gradient-orbit">Delivered!</span></>
            ) : (
              <>Your Edit is <span className="text-gradient-orbit">{currentStatus?.label}</span></>
            )}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Booking ID: {currentBooking.id}</p>
          {/* Cancel Booking Button - Only show before partner arrives (activeStep < 3 = SHOOTING) */}
          {!isComplete && !isDownloaded && activeStep < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
                  cancelBooking(currentBooking.id, "CLIENT");
                  toast.success("Booking cancelled.");
                  setCurrentView("packages");
                }
              }}
              className="mt-3 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 text-xs"
            >
              Cancel Booking
            </Button>
          )}
        </motion.div>

        {/* Status Pipeline */}
        <div className="orbit-card rounded-2xl p-3 sm:p-6">
          <div className="relative">
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute top-5 left-5 right-5 h-0.5 bg-orbit-border">
              <motion.div
                className="h-full bg-gradient-to-r from-orbit-cyan to-orbit-purple"
                initial={{ width: "0%" }}
                animate={{ width: `${(activeStep / (STATUS_PIPELINE.length - 1)) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-3 lg:gap-0 justify-between">
              {STATUS_PIPELINE.map((step, idx) => {
                const isActive = idx === activeStep;
                const isStepCompleted = idx < activeStep || isComplete;
                return (
                  <div key={step.status} className="flex lg:flex-col items-start lg:items-center gap-3 lg:gap-2 relative">
                    <div className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isActive && !isComplete
                        ? "bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white orbit-glow"
                        : isStepCompleted
                        ? "bg-orbit-cyan/20 text-orbit-cyan"
                        : "bg-white/5 text-muted-foreground border border-orbit-border"
                    }`}>
                      {(isStepCompleted && !isActive) || isComplete ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : step.icon}
                      {isActive && !isComplete && <div className="absolute inset-0 rounded-full border-2 border-orbit-cyan animate-pulse-ring" />}
                    </div>
                    <div className="lg:text-center">
                      <div className={`text-[10px] sm:text-xs font-semibold ${isActive ? "text-orbit-cyan" : isStepCompleted ? "text-orbit-cyan/70" : "text-muted-foreground"}`}>
                        {step.label}
                      </div>
                      {isActive && !isComplete && (
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 max-w-[120px] lg:mx-auto">
                          {step.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Stats — only show when NOT fully downloaded */}
        {!isDownloaded && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {[
              // Only show Sync progress during SYNCING phase
              {
                icon: <Upload className="w-3.5 h-3.5 text-orbit-cyan" />,
                label: "Sync",
                value: isComplete ? "100%" : isSyncingPhase ? `${syncProgress}%` : activeStep > 4 ? "100%" : "—",
                progress: isComplete ? 100 : isSyncingPhase ? syncProgress : activeStep > 4 ? 100 : undefined,
                showProgress: isSyncingPhase || isComplete || activeStep > 4,
              },
              {
                icon: <Timer className="w-3.5 h-3.5 text-orbit-cyan" />,
                label: "ETA",
                value: `${isComplete ? "0" : activeStep >= 5 ? countdown : "—"}`,
                suffix: activeStep >= 5 && !isComplete ? " min" : "",
              },
              {
                icon: <Film className="w-3.5 h-3.5 text-orbit-cyan" />,
                label: "Package",
                value: currentBooking.packageName,
              },
              {
                icon: <CircleDot className="w-3.5 h-3.5 text-orbit-cyan" />,
                label: "Status",
                badge: true,
                value: isComplete ? "Delivered" : "In Progress",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className="orbit-card rounded-xl p-3 sm:p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</span>
                </div>
                {stat.badge ? (
                  <Badge variant="outline" className={`text-[10px] sm:text-xs font-bold ${isComplete ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-orbit-cyan/30 text-orbit-cyan bg-orbit-cyan/10"}`}>
                    {stat.value}
                  </Badge>
                ) : (
                  <>
                    <div className="text-sm sm:text-2xl font-black text-foreground">
                      {stat.value}
                      <span className="text-[10px] sm:text-sm text-muted-foreground">{stat.suffix || ""}</span>
                    </div>
                    {stat.showProgress && stat.progress !== undefined && <Progress value={stat.progress} className="mt-2 h-1 bg-white/5" />}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* En Route Card — only during EN_ROUTE phase */}
        <AnimatePresence>
          {activeStep === 2 && !isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="orbit-card rounded-2xl p-4 sm:p-6 border border-orbit-cyan/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orbit-cyan/20 to-orbit-purple/20 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-orbit-cyan" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orbit-cyan">Partner is En Route</h4>
                  <p className="text-xs text-muted-foreground">Your Visual Architect is heading to your location</p>
                </div>
              </div>
              <div className="orbit-card rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-4 h-4 text-orbit-cyan shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Destination</div>
                    <div className="text-sm font-medium">{currentBooking.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Navigation className="w-4 h-4 text-green-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Estimated Arrival</div>
                    <div className="text-sm font-medium text-green-400">~{Math.max(5, 15 - Math.floor(Date.now() / 1000) % 10)} minutes</div>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Partner</span>
                  <span>You</span>
                </div>
                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orbit-cyan to-orbit-purple rounded-full"
                    initial={{ width: "20%" }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Live tracking active</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Delivery Card ────────────────────────────────────── */}
        <AnimatePresence>
          {isComplete && !isDownloaded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="orbit-card rounded-2xl p-5 sm:p-8 text-center border border-green-500/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <PartyPopper className="w-12 h-12 mx-auto mb-4 text-orbit-cyan" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-black mb-2">
                Your Reel is <span className="text-gradient-orbit">Ready!</span>
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-5">
                Professional cinematic edit delivered in record time.
              </p>

              {/* Adaptive Bitrate Stream Preview */}
              {currentBooking.hlsPlaylistUrl || currentBooking.reelUrl ? (
                hlsLoaded ? (
                  <div className="mb-6">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orbit-cyan animate-pulse" />
                      Adaptive ABR Stream Preview
                    </p>
                    <HlsPlayer src={currentBooking.hlsPlaylistUrl || currentBooking.reelUrl || ""} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center aspect-video rounded-xl bg-black border border-orbit-cyan/15 mb-6 max-w-lg mx-auto">
                    <Loader2 className="w-6 h-6 text-orbit-cyan animate-spin mb-2" />
                    <p className="text-xs text-muted-foreground">Initializing stream...</p>
                  </div>
                )
              ) : null}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold orbit-glow py-6 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Reel
                </Button>

                <Button
                  onClick={() => {
                    markBookingDelivered(currentBooking.id);
                    markBookingDownloaded(currentBooking.id);
                  }}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-6 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Download Complete + Review ────────────────────────── */}
        <AnimatePresence>
          {isDownloaded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Task Complete Card */}
              <div className="orbit-card rounded-2xl p-5 sm:p-6 text-center border border-green-500/25 relative">
                <button
                  onClick={handleReviewDone}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all active:scale-95"
                  title="Close completed screen"
                >
                  <X className="w-4 h-4" />
                </button>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CircleCheckBig className="w-8 h-8 text-green-400" />
                  </div>
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-black mb-2">
                  Task <span className="text-gradient-orbit">Completed!</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Your video has been delivered and downloaded successfully.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Booking #{currentBooking.id} · {currentBooking.packageName}
                </p>
              </div>

              {/* Review Section — shown after download */}
              <ReviewSection bookingId={currentBooking.id} onReviewDone={handleReviewDone} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Details */}
        <div className="orbit-card rounded-2xl p-4 sm:p-6">
          <h4 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4 text-muted-foreground">Booking Details</h4>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            {[
              { label: "Date", value: new Date(currentBooking.bookingDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }) },
              { label: "Time", value: currentBooking.timeSlot },
              { label: "Location", value: currentBooking.location },
              { label: "Amount", value: formatCurrency(currentBooking.packagePrice) },
            ].map((d) => (
              <div key={d.label}>
                <span className="text-muted-foreground">{d.label}</span>
                <div className="font-medium">{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}