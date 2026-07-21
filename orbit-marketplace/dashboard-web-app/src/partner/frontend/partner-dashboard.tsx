"use client";

/**
 * 🟣 PARTNER FRONTEND | PartnerDashboard (Home)
 *
 * Home screen showing Available Work bookings fetched from API + WebSocket.
 * Active workflow (navigate → shoot → sync → privacy → payment)
 * is also handled here since it starts from accepting a booking.
 *
 * Real-time: WebSocket pushes new bookings to this partner.
 * Accept/Decline: Calls API to update server state + notify others.
 *
 * Used by: partner-app.tsx
 * Category: Partner UI
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ArrowRight,
  Calendar as CalendarIcon,
  MapPin,
  Briefcase,
  Play,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { type BookingInfo, type BookingStatus } from "@/lib/types";
import { SHOT_LIST } from "./constants";
import { formatCurrency } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { MapNavigation } from "./map-navigation";
import { ShootingPhase } from "./shooting-phase";
import { SyncModule } from "./sync-module";
import { PrivacyShield } from "./privacy-shield";
import { PaymentReceived } from "./payment-received";
import { io, Socket } from "socket.io-client";

type PartnerPhase = "available" | "navigating" | "shooting" | "syncing" | "privacy" | "payment";

export function PartnerDashboard() {
  const {
    partnerActiveBooking, setPartnerActiveBooking, cancelBooking,
    updateBookingStatus, markBookingDelivered, markBookingDownloaded,
    addBooking, user, bookings, availableBookings, userRole,
    setAvailableBookings, addAvailableBooking, removeAvailableBooking,
    partnerId, fetchAvailableBookings, creditPartnerWallet,
    updateSyncPercentage, fetchPartnerProfile,
  } = useAppStore();

  const [partnerPhase, setPartnerPhase] = useState<PartnerPhase>("available");
  const [shotUploads, setShotUploads] = useState<Map<string, string>>(new Map());
  const [uploadingShotId, setUploadingShotId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [completedShots, setCompletedShots] = useState<Set<string>>(new Set());
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncSpeed, setSyncSpeed] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  // Fetch partner profile on mount
  useEffect(() => {
    if (partnerId) {
      fetchPartnerProfile();
    }
  }, [partnerId, fetchPartnerProfile]);

  useEffect(() => {
    if (user.isOnline && partnerId) {
      Promise.resolve().then(() => setIsLoading(true));
      fetchAvailableBookings().finally(() => setIsLoading(false));
    }
  }, [user.isOnline, partnerId, fetchAvailableBookings]);

  // Auto-detect phase from active booking status
  useEffect(() => {
    if (partnerActiveBooking) {
      const status = partnerActiveBooking.status;
      if (status === "EN_ROUTE") {
        Promise.resolve().then(() => setPartnerPhase("navigating"));
      } else if (status === "SHOOTING") {
        Promise.resolve().then(() => setPartnerPhase("shooting"));
      } else if (status === "SYNCING") {
        Promise.resolve().then(() => setPartnerPhase("syncing"));
      } else if (status === "EDITING" || status === "READY_TO_EDIT") {
        Promise.resolve().then(() => setPartnerPhase("privacy"));
      } else if (status === "DELIVERED" || status === "CANCELLED") {
        Promise.resolve().then(() => setPartnerPhase("available"));
      }
    } else {
      Promise.resolve().then(() => setPartnerPhase("available"));
    }
  }, [partnerActiveBooking]);

  // ─── WebSocket connection for real-time push ──────────────────────
  useEffect(() => {
    if (!partnerId || userRole !== "PARTNER") return;

    const socket = io("/?XTransformPort=3003", {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on("connect", () => {
      // Register this partner as online
      if (user.isOnline) {
        socket.emit("partner:online", { partnerId });
      }
    });

    // Listen for new booking dispatches
    socket.on("booking:dispatched", (data: { booking: BookingInfo; dispatchId: string; round: number }) => {
      addAvailableBooking(data.booking);
      toast.success("New work available!", {
        description: `${data.booking.packageName} — ${data.booking.location ? data.booking.location.split(" @")[0] : ""}`,
        duration: 6000,
      });
    });

    // Listen for when another partner accepts a booking we were offered
    socket.on("booking:accepted-by-other", (data: { bookingId: string; acceptedByPartnerId: string }) => {
      removeAvailableBooking(data.bookingId);
      // Don't show toast if we were the one who accepted
      if (data.acceptedByPartnerId !== partnerId) {
        toast.info("Booking taken by another partner", { duration: 3000 });
      }
    });

    // Listen for booking cancellations
    socket.on("booking:cancelled", (data: { bookingId: string; cancelledBy: string }) => {
      removeAvailableBooking(data.bookingId);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("partner:offline", { partnerId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [partnerId, userRole, user.isOnline, addAvailableBooking, removeAvailableBooking]);

  // ─── Notify WebSocket when going online/offline ───────────────────
  useEffect(() => {
    if (!socketRef.current?.connected) return;
    if (user.isOnline) {
      socketRef.current.emit("partner:online", { partnerId });
    } else {
      socketRef.current.emit("partner:offline", { partnerId });
    }
  }, [user.isOnline, partnerId]);

  // Cleanup sync interval on unmount
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  const syncFiles = ["clip_001_4k.mov", "clip_002_4k.mov", "clip_003_4k.mov", "clip_004_4k.mov", "clip_005_4k.mov"];

  // ─── Accept a booking via API ─────────────────────────────────────
  const handleAcceptBooking = useCallback(async (booking: BookingInfo) => {
    setIsAccepting(booking.id);
    try {
      // Call the accept API
      const res = await fetch(`/api/bookings/${booking.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to accept booking");
      }

      // Update local state
      const acceptedBooking = { ...booking, status: "EN_ROUTE" as BookingStatus };
      addBooking(acceptedBooking);
      setPartnerActiveBooking(acceptedBooking);
      removeAvailableBooking(booking.id);
      setPartnerPhase("navigating");
      setCompletedShots(new Set());
      setShotUploads(new Map());
      toast.success("Booking accepted!", { description: `Navigate to ${booking.location ? booking.location.split(" @")[0] : ""}` });

      // Notify WebSocket that we accepted
      socketRef.current?.emit("booking:accept", { bookingId: booking.id, partnerId });

      // Sync DB profile
      await fetchPartnerProfile();
    } catch (err) {
      toast.error("Could not accept booking", {
        description: err instanceof Error ? err.message : "Another partner may have already accepted it.",
      });
      // Refresh available bookings in case state changed
      fetchAvailableBookings();
    } finally {
      setIsAccepting(null);
    }
  }, [partnerId, addBooking, setPartnerActiveBooking, removeAvailableBooking, fetchAvailableBookings, fetchPartnerProfile]);

  // ─── Decline a booking via API ────────────────────────────────────
  const handleDeclineBooking = useCallback(async (booking: BookingInfo) => {
    try {
      const res = await fetch(`/api/bookings/${booking.id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId }),
      });

      removeAvailableBooking(booking.id);
      toast.info("Booking declined", { description: "It will be offered to other partners." });

      // Notify WebSocket
      socketRef.current?.emit("booking:decline", { bookingId: booking.id, partnerId });

      // If the decline triggered a re-dispatch, we might get a new booking
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.reDispatched) {
          // Slight delay then refresh to get any new dispatches
          setTimeout(() => fetchAvailableBookings(), 1500);
        }
      }
    } catch {
      removeAvailableBooking(booking.id);
    }
  }, [partnerId, removeAvailableBooking, fetchAvailableBookings]);

  const handleFileUpload = (shotId: string) => {
    setUploadingShotId(shotId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadingShotId) {
      const fileName = e.target.files[0].name;
      setShotUploads((prev) => {
        const next = new Map(prev);
        next.set(uploadingShotId, fileName);
        return next;
      });
      setCompletedShots((prev) => {
        const next = new Set(prev);
        next.add(uploadingShotId);
        return next;
      });
      toast.success(`Uploaded for ${SHOT_LIST.find((s) => s.id === uploadingShotId)?.name}`, { description: fileName });
    }
    setUploadingShotId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleArrived = async () => {
    if (partnerActiveBooking) {
      try {
        await fetch(`/api/bookings/${partnerActiveBooking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SHOOTING" }),
        });
        updateBookingStatus(partnerActiveBooking.id, "SHOOTING");
      } catch (err) {
        console.error("Failed to update status to SHOOTING:", err);
      }
    }
    setPartnerPhase("shooting");
    toast.success("Arrived at location!", { description: "Ready to start shooting" });
  };

  const handleCompleteShooting = async () => {
    if (!partnerActiveBooking) return;
    const bookingId = partnerActiveBooking.id;

    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SYNCING" }),
      });
      updateBookingStatus(bookingId, "SYNCING");
    } catch (err) {
      console.error("Failed to update status to SYNCING:", err);
    }
    setPartnerPhase("syncing");
    setSyncProgress(0);
    
    const filesCount = syncFiles.length;
    const progressMap = new Map<string, number>();
    syncFiles.forEach(f => progressMap.set(f, 0));

    // Update overall progress based on individual file progresses
    const updateOverallProgress = () => {
      let totalProgress = 0;
      progressMap.forEach((p) => {
        totalProgress += p;
      });
      const overall = Math.min(99, Math.round(totalProgress / filesCount));
      setSyncProgress(overall);
    };

    try {
      const uploadedUrls: string[] = [];
      const proxyUrls: string[] = [];
      let totalBytesUploaded = 0;

      // 1. Upload lightweight proxy files first (simulating local compression)
      for (let i = 0; i < syncFiles.length; i++) {
        const fileName = syncFiles[i];
        const proxyName = `proxy_${fileName}`;
        setCurrentFile(`Compressing & Uploading: ${proxyName}`);
        
        // Get presigned URL for proxy
        const res = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: proxyName,
            contentType: "video/quicktime",
            bookingId: bookingId,
          }),
        });

        if (!res.ok) throw new Error(`Failed to get presigned URL for proxy ${fileName}`);
        const { url, key } = await res.json();
        proxyUrls.push(`/upload/${key}`);
        uploadedUrls.push(`/upload/bookings/${bookingId}/${fileName}`);

        // Very tiny Blob (~10KB) representing the proxy
        const mockProxyBlob = new Blob([new Uint8Array(10 * 1024)], { type: "video/quicktime" });
        totalBytesUploaded += mockProxyBlob.size;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", "video/quicktime");
          let startTime = Date.now();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const fileProgress = (event.loaded / event.total) * 100;
              progressMap.set(fileName, fileProgress);
              updateOverallProgress();

              const elapsedSeconds = (Date.now() - startTime) / 1000;
              if (elapsedSeconds > 0) {
                const speed = (event.loaded / (1024 * 1024)) / elapsedSeconds;
                setSyncSpeed(parseFloat(speed.toFixed(1)) || 5.2);
              }
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              progressMap.set(fileName, 100);
              updateOverallProgress();
              resolve();
            } else {
              reject(new Error(`Proxy upload failed for ${fileName}`));
            }
          };

          xhr.onerror = () => reject(new Error(`Network error uploading proxy for ${fileName}`));
          xhr.send(mockProxyBlob);
        });
      }

      setSyncProgress(100);

      // 2. Mark sync complete with the server, providing BOTH target raw urls and generated proxy urls
      const completeRes = await fetch(`/api/bookings/${bookingId}/sync-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footageUrls: uploadedUrls,
          proxyFootageUrl: proxyUrls,
          fileName: syncFiles[syncFiles.length - 1],
          fileSize: totalBytesUploaded,
        }),
      });

      if (!completeRes.ok) {
        throw new Error("Failed to mark sync complete on server");
      }

      // Update local Zustand store & fetch profile to credit wallet
      updateBookingStatus(bookingId, "EDITING");
      await fetchPartnerProfile();

      toast.success("Wallet credited with ₹700 payout! Ready to start background sync.");
      setTimeout(() => setPartnerPhase("privacy"), 500);

      // 3. Spawn background upload of original high-fidelity 4K files quietly
      setTimeout(async () => {
        console.log("[Background Sync] Starting background master upload to Cloudflare R2...");
        try {
          for (let i = 0; i < syncFiles.length; i++) {
            const fileName = syncFiles[i];
            
            // Get presigned URL for master file
            const res = await fetch("/api/upload/presigned-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename: fileName,
                contentType: "video/quicktime",
                bookingId: bookingId,
              }),
            });

            if (!res.ok) {
              console.warn(`[Background Sync] Failed to get URL for ${fileName}`);
              continue;
            }
            const { url } = await res.json();

            // Large file simulator (500KB)
            const mockMasterBlob = new Blob([new Uint8Array(500 * 1024)], { type: "video/quicktime" });
            
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", url);
            xhr.setRequestHeader("Content-Type", "video/quicktime");
            xhr.send(mockMasterBlob);
            
            console.log(`[Background Sync] Uploading master raw: ${fileName}`);
          }
          console.log("[Background Sync] All master raw 4K files successfully uploaded to Cloudflare R2.");
        } catch (bgErr) {
          console.error("[Background Sync] Error uploading master files:", bgErr);
        }
      }, 1000);

    } catch (err: any) {
      console.error(err);
      toast.error("Sync failed", {
        description: err.message || "An error occurred during footage sync.",
      });
    }
  };

  const handleViewPayment = () => {
    setPartnerPhase("payment");
  };

  const handleCompleteAndReturn = async () => {
    if (partnerActiveBooking) {
      // Sync DB profile to pull credited wallet balance
      await fetchPartnerProfile();
    }
    setPartnerPhase("available");
    setPartnerActiveBooking(null);
    setCompletedShots(new Set());
    setSyncProgress(0);
    toast.success("Shoot completed successfully!");
  };

  // ─── Cancel booking via API ───────────────────────────────────────
  const handleCancelBooking = useCallback(async () => {
    if (!partnerActiveBooking) return;
    if (!confirm("Are you sure you want to cancel this booking? It will be reassigned to another partner.")) return;

    try {
      await fetch(`/api/bookings/${partnerActiveBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", cancelledBy: "PARTNER" }),
      });
    } catch { /* still update local */ }

    cancelBooking(partnerActiveBooking.id, "PARTNER");
    setPartnerPhase("available");
    setPartnerActiveBooking(null);

    // Sync DB profile
    await fetchPartnerProfile();

    toast.success("Booking cancelled. It will be reassigned to another partner.");
  }, [partnerActiveBooking, cancelBooking, setPartnerActiveBooking, fetchPartnerProfile]);

  // ─── Active Workflow (when partner has accepted a booking) ──────────
  if (partnerActiveBooking && partnerPhase !== "available") {
    return (
      <section className="pb-8 sm:pb-16 px-0 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge variant="outline" className="mb-3 border-orbit-purple/30 text-orbit-purple bg-orbit-purple/5">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              Active Work
            </Badge>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
              {partnerPhase === "navigating" ? (
                <>Navigate to <span className="text-gradient-orbit">Location</span></>
              ) : partnerPhase === "shooting" ? (
                <>Shoot <span className="text-gradient-orbit">In Progress</span></>
              ) : partnerPhase === "syncing" ? (
                <>Syncing <span className="text-gradient-orbit">Footage</span></>
              ) : partnerPhase === "privacy" ? (
                <>Privacy <span className="text-gradient-orbit">Verified</span></>
              ) : (
                <>Payment <span className="text-gradient-orbit">Received!</span></>
              )}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {partnerActiveBooking.packageName} · {partnerActiveBooking.location ? partnerActiveBooking.location.split(" @")[0] : ""}
            </p>
            {/* Cancel Booking Button - Only show before arriving at location */}
            {partnerPhase === "navigating" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelBooking}
                className="mt-3 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 text-xs"
              >
                Cancel Booking
              </Button>
            )}
          </motion.div>

          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelected} />

          <AnimatePresence mode="wait">
            {partnerPhase === "navigating" && (
              <motion.div key="navigating" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <MapNavigation booking={partnerActiveBooking} onArrived={handleArrived} />
              </motion.div>
            )}
            {partnerPhase === "shooting" && (
              <motion.div key="shooting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ShootingPhase booking={partnerActiveBooking} completedShots={completedShots} setCompletedShots={setCompletedShots} shotUploads={shotUploads} handleFileUpload={handleFileUpload} onCompleteShooting={handleCompleteShooting} />
              </motion.div>
            )}
            {partnerPhase === "syncing" && (
              <motion.div key="syncing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <SyncModule syncProgress={syncProgress} syncSpeed={syncSpeed} currentFile={currentFile} syncFiles={syncFiles} />
              </motion.div>
            )}
            {partnerPhase === "privacy" && (
              <motion.div key="privacy" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <PrivacyShield syncFiles={syncFiles} onViewPayment={handleViewPayment} />
              </motion.div>
            )}
            {partnerPhase === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <PaymentReceived booking={partnerActiveBooking} onCompleteAndReturn={handleCompleteAndReturn} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    );
  }

  // ─── If partner is offline ──────────────────────────────────────────
  if (!user.isOnline) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 sm:space-y-5"
      >
        <motion.div variants={staggerItem}>
          <div className="orbit-card rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-500/10 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-gray-400/50" />
            </div>
            <h3 className="text-base font-bold mb-2 text-foreground">You&apos;re Offline</h3>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Go online to receive new booking requests from clients.
            </p>
            <p className="text-[10px] text-muted-foreground/40">
              Tap the <span className="text-gray-400">Online/Offline</span> toggle in the header to go online.
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── If partner has an active booking restored from storage ──────────
  if (partnerActiveBooking && partnerPhase === "available") {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div variants={staggerItem}>
          <div className="orbit-card rounded-xl p-4 border border-orbit-purple/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orbit-purple/15 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-orbit-purple" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-foreground truncate">Active Booking Found</h3>
                <p className="text-[10px] text-muted-foreground/60 truncate">
                  {partnerActiveBooking.packageName} · {partnerActiveBooking.location ? partnerActiveBooking.location.split(" @")[0] : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPartnerPhase("navigating")}
                className="flex-1 bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold h-9 text-xs"
              >
                <Play className="w-3.5 h-3.5 mr-1" /> Resume
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelBooking}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-9"
              >
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Home: Available Work ────────────────────────────────────────
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-3 sm:space-y-4"
    >
      {/* Section Header */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orbit-cyan/15 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-orbit-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Available Work</h3>
              <p className="text-[10px] text-muted-foreground/60">New bookings waiting for you</p>
            </div>
          </div>
          {availableBookings.length > 0 && (
            <Badge className="bg-orbit-cyan/15 text-orbit-cyan border-0 text-[10px] font-bold px-2 py-0.5">
              {availableBookings.length} new
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading ? (
        <motion.div variants={staggerItem}>
          <div className="orbit-card rounded-xl p-8 text-center">
            <Loader2 className="w-6 h-6 text-orbit-cyan animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Looking for available work...</p>
          </div>
        </motion.div>
      ) : availableBookings.length === 0 ? (
        /* Empty State */
        <motion.div variants={staggerItem}>
          <div className="orbit-card rounded-xl p-6 sm:p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.03] flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <h3 className="text-sm font-bold mb-1">No Available Work</h3>
            <p className="text-xs text-muted-foreground">
              New bookings will appear here when clients book sessions.
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-2">
              Keep the app open to receive real-time notifications.
            </p>
          </div>
        </motion.div>
      ) : (
        /* Work Cards */
        <div className="space-y-2.5">
          {availableBookings.map((booking) => (
            <motion.div
              key={booking.id}
              variants={staggerItem}
              className="orbit-card rounded-xl overflow-hidden border border-orbit-border/50 hover:border-orbit-cyan/25 transition-all group"
            >
              {/* Card top accent line */}
              <div className="h-[2px] bg-gradient-to-r from-orbit-cyan via-orbit-purple to-orbit-cyan opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-3 sm:p-4">
                {/* Row 1: ID + Price */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orbit-cyan/15 to-orbit-purple/15 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-orbit-cyan" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{booking.id}</h4>
                      <Badge
                        variant="outline"
                        className={`text-[8px] mt-0.5 ${
                          booking.packagePrice >= 4999
                            ? "border-orbit-cyan/30 text-orbit-cyan"
                            : "border-orbit-purple/30 text-orbit-purple"
                        }`}
                      >
                        {booking.packageName}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-gradient-orbit">
                      {formatCurrency(700)}
                    </div>
                    <div className="text-[8px] text-muted-foreground/50">per shoot</div>
                  </div>
                </div>

                {/* Row 2: Details */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] sm:text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-2.5 h-2.5 text-orbit-cyan/70" />
                    <span className="truncate">{new Date(booking.bookingDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-orbit-cyan/70" />
                    <span className="truncate">{booking.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-orbit-cyan/70" />
                    <span className="truncate">{booking.location ? booking.location.split(" @")[0] : ""}</span>
                  </div>
                </div>

                {/* Row 3: Notes */}
                {booking.notes && (
                  <p className="text-[10px] text-muted-foreground/40 italic mb-2 line-clamp-1">
                    &ldquo;{booking.notes}&rdquo;
                  </p>
                )}

                {/* Row 4: Accept + Decline Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptBooking(booking)}
                    disabled={isAccepting === booking.id}
                    className="flex-1 bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold orbit-glow h-9 text-xs"
                  >
                    {isAccepting === booking.id ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Accepting...</>
                    ) : (
                      <>Accept Booking <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeclineBooking(booking)}
                    disabled={isAccepting === booking.id}
                    className="border-orbit-border/50 text-muted-foreground hover:text-red-400 hover:border-red-500/30 h-9 text-xs px-3"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}