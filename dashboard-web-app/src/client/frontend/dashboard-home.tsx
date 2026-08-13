"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Dna,
  FileText,
  Star,
  Sparkles,
  Zap,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Shield,
  MapPin,
  Flame,
  ArrowRight,
  Play,
  Film,
  Camera,
  Layers,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";

type BookingTab = "total" | "active" | "done";

function compactStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    PAID: "Paid",
    PARTNER_DISPATCHED: "Dispatched",
    EN_ROUTE: "En Route",
    SHOOTING: "Shooting",
    SYNCING: "Syncing",
    EDITING: "Editing",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

export function DashboardHome() {
  const {
    currentBooking,
    bookings,
    packages,
    setCurrentView,
    selectedPackage,
    setSelectedPackage,
    setHighlightedPackageId,
  } = useAppStore();

  const [slotSeconds, setSlotSeconds] = useState(299);
  useEffect(() => {
    const t = setInterval(() => setSlotSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const slotTimer = `${Math.floor(slotSeconds / 60)}:${String(slotSeconds % 60).padStart(2, "0")}`;

  const completedBookingsList = bookings.filter((b) => b.status === "DELIVERED");
  const activeBookingsList = bookings.filter(
    (b) => !["DELIVERED", "CANCELLED"].includes(b.status)
  );

  // Active shoot information for the live banner
  const activeShoot = currentBooking || (activeBookingsList.length > 0 ? activeBookingsList[0] : null);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-24"
    >
      {/* ── 1. Giant Cinematic Editorial Headline ── */}
      <motion.div variants={staggerItem} className="pt-2">
        <div className="space-y-1">
          <h1 className="font-space font-extrabold text-4xl sm:text-5xl text-white tracking-tight leading-none">
            Shoot
          </h1>
          <h2 className="font-playfair italic font-normal text-3xl sm:text-4xl text-[#00BFFF] leading-tight text-glow-cyan">
            In Progress.
          </h2>
          <p className="font-mono text-[10px] sm:text-xs text-zinc-400 uppercase tracking-[0.2em] pt-1">
            ORBIT V1.0.4 — PREMIUM ACCESS
          </p>
        </div>
      </motion.div>

      {/* ── 2. 2x2 Aspect-Square Quick Action Grid ── */}
      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {/* Card 1: Book New Shoot */}
          <button
            onClick={() => {
              if (packages.length > 0 && !selectedPackage) setSelectedPackage(packages[0]);
              setCurrentView("booking");
            }}
            className="group relative aspect-square p-5 rounded-2xl bg-[#0B0B0E] border border-white/10 hover:border-[#00BFFF]/40 transition-all duration-300 active:scale-[0.98] flex flex-col justify-between text-left shadow-lg overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00BFFF] text-black flex items-center justify-center font-bold shadow-[0_0_20px_rgba(0,191,255,0.4)] group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-space font-bold text-sm sm:text-base text-white uppercase tracking-tight leading-tight">
                BOOK<br />NEW SHOOT
              </h3>
              <p className="font-mono italic text-[10px] sm:text-[11px] text-zinc-400 uppercase tracking-wider mt-1">
                INSTANT MATCHING
              </p>
            </div>
          </button>

          {/* Card 2: Track Order */}
          <button
            onClick={() => setCurrentView("tracking")}
            className="group relative aspect-square p-5 rounded-2xl bg-[#0B0B0E] border border-white/10 hover:border-[#A020F0]/40 transition-all duration-300 active:scale-[0.98] flex flex-col justify-between text-left shadow-lg overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-[#A020F0] text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(160,32,240,0.4)] group-hover:scale-105 transition-transform">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-space font-bold text-sm sm:text-base text-white uppercase tracking-tight leading-tight">
                TRACK<br />ORDER
              </h3>
              <p className="font-mono italic text-[10px] sm:text-[11px] text-zinc-400 uppercase tracking-wider mt-1">
                {activeBookingsList.length > 0 ? `${activeBookingsList.length} ACTIVE` : "1 ACTIVE"}
              </p>
            </div>
          </button>

          {/* Card 3: Recent Projects */}
          <button
            onClick={() => setCurrentView("profile")}
            className="group relative aspect-square p-5 rounded-2xl bg-[#0B0B0E] border border-white/10 hover:border-white/25 transition-all duration-300 active:scale-[0.98] flex flex-col justify-between text-left shadow-lg overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-space font-bold text-sm sm:text-base text-white uppercase tracking-tight leading-tight">
                RECENT<br />PROJECTS
              </h3>
              <p className="font-mono italic text-[10px] sm:text-[11px] text-zinc-400 uppercase tracking-wider mt-1">
                {completedBookingsList.length > 0 ? `${completedBookingsList.length} DELIVERED` : "12 DELIVERED"}
              </p>
            </div>
          </button>

          {/* Card 4: Brand Identity */}
          <button
            onClick={() => {
              const ugcPkg = packages.find((p) => p.tier === "PROFESSIONAL" || p.id === "pkg-professional");
              if (ugcPkg) {
                setSelectedPackage(ugcPkg);
                setHighlightedPackageId(ugcPkg.id);
              }
              setCurrentView("packages");
            }}
            className="group relative aspect-square p-5 rounded-2xl bg-[#0B0B0E] border border-white/10 hover:border-[#F59E0B]/40 transition-all duration-300 active:scale-[0.98] flex flex-col justify-between text-left shadow-lg overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-zinc-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Star className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-space font-bold text-sm sm:text-base text-white uppercase tracking-tight leading-tight">
                BRAND<br />IDENTITY
              </h3>
              <p className="font-mono italic text-[10px] sm:text-[11px] text-zinc-400 uppercase tracking-wider mt-1">
                ASSETS & DNA
              </p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* ── 3. Live Shoot Tracking Card ── */}
      <motion.div variants={staggerItem}>
        <div className="relative overflow-hidden rounded-2xl bg-[#0B0B0E] border border-purple-500/20 p-4 sm:p-5 shadow-[0_0_25px_rgba(160,32,240,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1.5 min-w-0 flex-1">
              <p className="font-mono text-[10px] font-bold text-[#00BFFF] tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00BFFF] animate-ping" />
                LIVE SHOOT TRACKING
              </p>
              <h4 className="font-space font-bold text-base text-white truncate">
                {activeShoot ? `${activeShoot.packageName || "Personalized"} in progress` : "Personalized in progress"}
              </h4>
              <p className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#00BFFF] shrink-0" />
                <span className="truncate">
                  {activeShoot?.location || "Kartar Mansion, 35, Dr Dadasaheb Phalke Rd, Dadar..."}
                </span>
              </p>
            </div>

            <button
              onClick={() => setCurrentView("tracking")}
              className="shrink-0 bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-black font-space font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,191,255,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              Track <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── 4. Featured Packages Strip ── */}
      <motion.div variants={staggerItem} className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00BFFF]" />
            <h3 className="font-space font-bold text-base sm:text-lg text-white">Featured Packages</h3>
          </div>
          <button
            onClick={() => setCurrentView("packages")}
            className="text-xs font-bold text-[#00BFFF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Personalized */}
          <button
            onClick={() => {
              if (packages[0]) setSelectedPackage(packages[0]);
              setCurrentView("booking");
            }}
            className="bg-[#0B0B0E] rounded-2xl p-4 sm:p-5 text-left border border-white/10 hover:border-[#00BFFF]/40 transition-all group relative cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-space font-bold text-base text-white">Personalized</h4>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">60-120 mins delivery</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="font-space font-black text-2xl text-[#00BFFF] mt-3">
              ₹1,999<span className="text-xs font-normal text-zinc-500">/session</span>
            </p>
            <div className="mt-3 space-y-1.5">
              {["1 Cinematic Reel", "4K HDR Master", "Wireless Mic Sync"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </button>

          {/* Card 2: Professional UGC */}
          <button
            onClick={() => {
              const ugc = packages.find((p) => p.tier === "PROFESSIONAL") || packages[1];
              if (ugc) setSelectedPackage(ugc);
              setCurrentView("booking");
            }}
            className="bg-[#0D0B12] rounded-2xl p-4 sm:p-5 text-left border border-[#A020F0]/30 hover:border-[#A020F0]/60 transition-all group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 bg-[#A020F0] text-white text-[9px] font-black px-2.5 py-1 rounded-bl-xl tracking-wider">
              POPULAR
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-space font-bold text-base text-white pr-14">Professional (UGC)</h4>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">60-120 mins delivery</p>
              </div>
            </div>
            <p className="font-space font-black text-2xl text-[#00BFFF] mt-3">
              ₹4,999<span className="text-xs font-normal text-zinc-500">/session</span>
            </p>
            <div className="mt-3 space-y-1.5">
              {["Up to 3 Cinematic Reels", "Brand DNA Custom Styling", "Priority 60-min Queue"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#A020F0] shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </button>
        </div>
      </motion.div>

      {/* ── 5. HUD Metric Strip ── */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#0B0B0E] rounded-2xl p-4 border border-white/10 grid grid-cols-3 text-center divide-x divide-white/10">
          <div>
            <p className="font-space text-lg font-extrabold text-[#00BFFF]">60 min</p>
            <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Avg Delivery</p>
          </div>
          <div>
            <p className="font-space text-lg font-extrabold text-[#10B981]">4K HDR</p>
            <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Cinema Grade</p>
          </div>
          <div>
            <p className="font-space text-lg font-extrabold text-[#A020F0]">500+</p>
            <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Projects</p>
          </div>
        </div>
      </motion.div>

      {/* ── 6. Trust & Security Strip ── */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 bg-[#0A0F0A] rounded-2xl p-4 border border-emerald-900/30">
          <Shield className="w-5 h-5 text-[#10B981] shrink-0" />
          <div>
            <p className="font-space text-xs font-bold text-white">Orbit Trust & Delivery Guarantee</p>
            <p className="text-[10px] text-zinc-400">Verified cinema videographers • Secure escrows • Instant delivery SLA</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
