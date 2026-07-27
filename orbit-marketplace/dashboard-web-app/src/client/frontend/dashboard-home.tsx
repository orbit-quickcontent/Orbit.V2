"use client";

/**
 * 🔵 CLIENT FRONTEND | DashboardHome
 *
 * Compact mobile-first dashboard. Quick actions, active booking,
 * package cards, and collapsible booking history.
 * Optimized for minimal scrolling on mobile.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  CalendarCheck,
  Radar,
  Package,
  ArrowRight,
  Film,
  Star,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Video,
  CheckCircle2,
  Download,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatCurrency, isWithinRedownloadWindow, getRedownloadDaysRemaining } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";

type BookingTab = "total" | "active" | "done";

// Compact status label for badges
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

  const [activeTab, setActiveTab] = useState<BookingTab | null>(null);

  const completedBookingsList = bookings.filter((b) => b.status === "DELIVERED");
  const activeBookingsList = bookings.filter(
    (b) => !["DELIVERED", "CANCELLED"].includes(b.status)
  );
  const completedBookings = completedBookingsList.length;
  const activeBookings = activeBookingsList.length;

  const filteredBookings =
    activeTab === "total" ? bookings :
      activeTab === "active" ? activeBookingsList :
        completedBookingsList;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-5"
    >
      {/* ─── Subtitle Header ────────────────── */}
      <motion.div variants={staggerItem} className="py-2 select-none">
        <p className="text-sm sm:text-base text-slate-400 font-normal">
          Ready to create something cinematic?
        </p>
      </motion.div>

      {/* ─── Quick Actions (2x2 grid — auto-adjusting for screen ratios) ──────────────── */}
      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            {
              icon: <CalendarCheck className="w-5 h-5 text-cyan-400" />,
              label: "Book Now",
              desc: "Schedule a session",
              iconBg: "w-10 h-10 rounded-full flex items-center justify-center bg-cyan-950/40 border border-cyan-500/20",
              onClick: () => {
                if (packages.length > 0 && !selectedPackage) {
                  setSelectedPackage(packages[0]);
                }
                setCurrentView("booking");
              },
            },
            {
              icon: <Radar className="w-5 h-5 text-purple-400" />,
              label: "Track Order",
              desc: activeBookings > 0 ? `${activeBookings} active` : "No active",
              iconBg: "w-10 h-10 rounded-full flex items-center justify-center bg-purple-950/40 border border-purple-500/20",
              onClick: () => setCurrentView("tracking"),
            },
            {
              icon: <Package className="w-5 h-5 text-emerald-400" />,
              label: "Packages",
              desc: "View pricing",
              iconBg: "w-10 h-10 rounded-full flex items-center justify-center bg-emerald-950/40 border border-emerald-500/20",
              onClick: () => setCurrentView("packages"),
            },
            {
              icon: <Zap className="w-5 h-5 text-amber-400" />,
              label: "Brand DNA",
              desc: "Customize style",
              iconBg: "w-10 h-10 rounded-full flex items-center justify-center bg-amber-950/40 border border-amber-500/20",
              onClick: () => {
                const ugcPkg = packages.find((p) => p.tier === "PROFESSIONAL" || p.id === "pkg-professional");
                if (ugcPkg) {
                  setSelectedPackage(ugcPkg);
                  setHighlightedPackageId(ugcPkg.id);
                }
                setCurrentView("packages");
              },
            },
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="group bg-[#0D0D11] rounded-2xl p-4 sm:p-5 text-left border border-white/5 hover:border-cyan-500/30 transition-all duration-300 active:scale-[0.98] flex flex-col justify-between min-h-[116px] sm:min-h-[128px]"
            >
              <div className={`${action.iconBg} group-hover:scale-105 transition-transform duration-300`}>
                {action.icon}
              </div>
              <div className="mt-3">
                <h3 className="text-sm sm:text-base font-bold text-white font-space truncate leading-tight">
                  {action.label}
                </h3>
                <p className="text-xs text-slate-500 font-normal truncate leading-tight mt-1">
                  {action.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Our Packages Section ──────────────────────── */}
      <motion.div variants={staggerItem} className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Our Packages
          </h3>
          <button
            onClick={() => setCurrentView("packages")}
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2 Package Cards Side-by-Side (Auto-adjusting grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => {
              if (packages[0]) setSelectedPackage(packages[0]);
              setCurrentView("booking");
            }}
            className="bg-[#0C1014] rounded-2xl p-4 text-left border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group"
          >
            <h4 className="text-base font-bold text-white">Personalized</h4>
            <p className="text-sm font-extrabold text-cyan-400 mt-1">₹1,999/session</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>1 Cinematic Reel</span>
            </div>
          </button>

          <button
            onClick={() => {
              const ugc = packages.find((p) => p.tier === "PROFESSIONAL") || packages[1];
              if (ugc) setSelectedPackage(ugc);
              setCurrentView("booking");
            }}
            className="bg-[#130E1A] rounded-2xl p-4 text-left border border-purple-900/60 hover:border-purple-500/40 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">Professional (UGC)</h4>
              <Badge className="bg-purple-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                POPULAR
              </Badge>
            </div>
            <p className="text-sm font-extrabold text-cyan-400 mt-1">₹4,999/session</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>3 Cinematic Reels</span>
            </div>
          </button>
        </div>
      </motion.div>

      {/* ─── Delivery Stats Bar ─────────────────────── */}
      <motion.div variants={staggerItem} className="pt-2">
        <div className="bg-[#0D0D10] rounded-2xl p-4 border border-white/5 grid grid-cols-3 text-center divide-x divide-white/5">
          <div>
            <p className="text-base sm:text-lg font-extrabold text-cyan-400">60 min</p>
            <p className="text-[10px] sm:text-xs text-slate-500">Delivery Guarantee</p>
          </div>
          <div>
            <p className="text-base sm:text-lg font-extrabold text-cyan-400">4K HDR</p>
            <p className="text-[10px] sm:text-xs text-slate-500">Native Quality</p>
          </div>
          <div>
            <p className="text-base sm:text-lg font-extrabold text-cyan-400">500+</p>
            <p className="text-[10px] sm:text-xs text-slate-500">Reels Delivered</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Hero Gradient CTA Card ─────────────────── */}
      <motion.div variants={staggerItem} className="pt-2">
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-purple-900 rounded-2xl p-5 sm:p-6 text-left shadow-lg">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
            Ready to Create
          </h3>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
            Something Cinematic?
          </h3>
        </div>
      </motion.div>

      {/* ─── Booking History Section ────────────────────────── */}
      <motion.div variants={staggerItem} className="space-y-3">
        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-tight">
          <Clock className="w-4 h-4 text-zinc-300" />
          Booking History
        </h3>

        {/* Recent Delivered Card */}
        <div
          onClick={() => setCurrentView("tracking")}
          className="orbit-card rounded-[20px] p-4 border border-[#222630] hover:border-[#00B5FF]/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">Personalized</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-[#8E92A0] font-medium">Jul 1, 2026</span>
            </div>
            <p className="text-xs text-[#8E92A0] truncate max-w-xs">
              Kartar Mansion, 35, Dr Dadasaheb B...
            </p>
            <p className="text-[11px] font-mono text-[#00B5FF] pt-1">
              • Partner Salary: ₹700 (Paid)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Badge className="bg-[#00C853]/10 border border-[#00C853]/40 text-[#00C853] font-bold text-[9px] px-3 py-1 rounded-lg tracking-wider uppercase shadow-[0_0_10px_rgba(0,200,83,0.25)]">
              DELIVERED
            </Badge>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}