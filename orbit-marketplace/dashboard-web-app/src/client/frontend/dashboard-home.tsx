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
      {/* ─── Premium Brand Typography Header ────────────────── */}
      <motion.div variants={staggerItem} className="py-4 sm:py-6 select-none">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-space leading-none">
          Shoot
        </h2>
        <h2 className="text-4xl sm:text-5xl font-medium tracking-tight text-gradient-orbit editorial-italic leading-none mt-2">
          In Progress.
        </h2>
        <p className="text-[8px] sm:text-[9.5px] text-white/20 font-bold uppercase tracking-[0.25em] mt-4">
          Orbit v1.0.4 — Premium Access
        </p>
      </motion.div>

      {/* ─── Quick Actions (2x2 grid — compact) ──────────────── */}
      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <span className="font-extrabold text-sm text-black">+</span>,
              label: "BOOK NEW SHOOT",
              desc: "INSTANT MATCHING",
              bg: "bg-orbit-cyan",
              iconBg: "w-8 h-8 rounded-full flex items-center justify-center bg-orbit-cyan",
              onClick: () => {
                if (packages.length > 0 && !selectedPackage) {
                  setSelectedPackage(packages[0]);
                }
                setCurrentView("booking");
              },
            },
            {
              icon: <span className="font-extrabold text-[9px] text-white tracking-tighter">DNA</span>,
              label: "TRACK ORDER",
              desc: `${activeBookings} ACTIVE`,
              bg: "bg-orbit-purple",
              iconBg: "w-8 h-8 rounded-full flex items-center justify-center bg-orbit-purple",
              onClick: () => setCurrentView("tracking"),
            },
            {
              icon: <Film className="w-4 h-4 text-white" />,
              label: "RECENT PROJECTS",
              desc: `${completedBookings} DELIVERED`,
              bg: "bg-white/10",
              iconBg: "w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/5",
              onClick: () => setActiveTab(activeTab === "done" ? null : "done"),
            },
            {
              icon: <Star className="w-3.5 h-3.5 text-white fill-white" />,
              label: "BRAND IDENTITY",
              desc: "ASSETS & DNA",
              bg: "bg-white/10",
              iconBg: "w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/5",
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
              className="group orbit-card rounded-2xl p-4 text-left hover:border-orbit-cyan/20 transition-all duration-300 active:scale-[0.97]"
            >
              <div className={`${action.iconBg} mb-3.5 group-hover:scale-105 transition-transform duration-300`}>
                {action.icon}
              </div>
              <h3 className="text-[10px] sm:text-xs font-black text-white tracking-wider mb-0.5 font-space truncate">
                {action.label}
              </h3>
              <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wide truncate">
                {action.desc}
              </p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Active Booking Card (compact) ───────────────────── */}
      {currentBooking && !["DELIVERED", "CANCELLED"].includes(currentBooking.status) && (
        <motion.div variants={staggerItem}>
          <button
            onClick={() => setCurrentView("tracking")}
            className="w-full text-left group"
          >
            <div className="orbit-card rounded-xl p-2.5 sm:p-3 border-orbit-cyan/20 hover:border-orbit-cyan/40 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orbit-cyan/5 via-transparent to-orbit-purple/5 animate-data-stream" />
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orbit-cyan animate-pulse" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-orbit-cyan uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-orbit-cyan group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-orbit-cyan/20 to-orbit-purple/20 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-orbit-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] sm:text-xs font-bold text-foreground truncate">
                      {currentBooking.packageName}
                    </h4>
                    <p className="text-[9px] text-muted-foreground truncate">
                      #{currentBooking.id} · {currentBooking.location ? currentBooking.location.split(" @")[0] : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-orbit-cyan/30 text-orbit-cyan text-[8px] shrink-0"
                  >
                    {compactStatus(currentBooking.status)}
                  </Badge>
                </div>
                {/* Mini progress bar */}
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orbit-cyan to-orbit-purple rounded-full"
                    initial={{ width: "0%" }}
                    animate={{
                      width:
                        currentBooking.status === "PAID" ? "15%"
                          : currentBooking.status === "PARTNER_DISPATCHED" ? "30%"
                            : currentBooking.status === "EN_ROUTE" ? "45%"
                              : currentBooking.status === "SHOOTING" ? "60%"
                                : currentBooking.status === "SYNCING" ? "75%"
                                  : currentBooking.status === "EDITING" ? "90%"
                                    : "100%",
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      )}

      {/* ─── Featured Packages Section ──────────────────────── */}
      <motion.div variants={staggerItem} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-tight">
            <Zap className="w-4 h-4 text-[#00B5FF] fill-[#00B5FF]" />
            Featured Packages
          </h3>
          <button
            onClick={() => setCurrentView("packages")}
            className="text-xs font-bold text-[#00B5FF] hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Horizontal Package Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
          {packages.map((pkg, i) => {
            const isPurple = pkg.tier === "PROFESSIONAL" || pkg.price > 3000;
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="shrink-0 w-[260px] sm:w-[300px]"
              >
                <div
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setCurrentView("booking");
                  }}
                  className="orbit-card rounded-[22px] p-5 border border-[#222630] hover:border-[#00B5FF]/50 transition-all duration-300 flex flex-col h-full group cursor-pointer relative overflow-hidden"
                >
                  {/* Top Row: Title + Calendar Button */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-black text-white tracking-tight">
                        {pkg.name}
                      </h4>
                      <p className="text-xs text-[#8E92A0] font-medium mt-0.5">
                        60-120 mins delivery
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-[#16181E] border border-[#222630] flex items-center justify-center text-zinc-300 group-hover:border-[#00B5FF]/40 transition-colors">
                      <CalendarCheck className="w-4 h-4 text-[#00B5FF]" />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-1 my-3">
                    <span
                      className={`text-2xl sm:text-3xl font-black ${
                        isPurple ? "text-[#A832FF]" : "text-[#00B5FF]"
                      }`}
                    >
                      {formatCurrency(pkg.price)}
                    </span>
                    <span className="text-xs text-[#8E92A0] font-semibold">/session</span>
                  </div>

                  {/* Bullet Features */}
                  <div className="space-y-2.5 my-3 flex-1">
                    {pkg.features.slice(0, 2).map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2.5 text-xs text-zinc-200 font-medium">
                        <div className="w-4 h-4 rounded-full bg-[#00B5FF]/15 border border-[#00B5FF]/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-[#00B5FF]" />
                        </div>
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                    {pkg.features.length > 2 && (
                      <p className="text-xs text-[#8E92A0] font-semibold pt-1">
                        +{pkg.features.length - 2} more features
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button className="w-full mt-4 py-3 rounded-2xl bg-[#16181E] border border-[#222630] hover:bg-[#1E222A] hover:border-[#00B5FF]/50 text-white font-bold text-xs transition-all">
                    Book Now
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Stats Pill Row ─────────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-[24px] p-4 border border-[#222630] grid grid-cols-3 divide-x divide-[#222630] text-center">
          <div className="px-2">
            <div className="text-xl sm:text-2xl font-black text-[#00B5FF] tracking-tight">
              60<span className="text-xs font-bold text-[#00B5FF] ml-0.5">min</span>
            </div>
            <div className="text-[9px] font-extrabold text-[#8E92A0] tracking-[0.2em] uppercase mt-1">
              DELIVERY
            </div>
          </div>

          <div className="px-2">
            <div className="text-xl sm:text-2xl font-black text-[#A832FF] tracking-tight">
              4K
            </div>
            <div className="text-[9px] font-extrabold text-[#8E92A0] tracking-[0.2em] uppercase mt-1">
              QUALITY
            </div>
          </div>

          <div className="px-2">
            <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00D2FF] to-[#00C853] tracking-tight">
              500+
            </div>
            <div className="text-[9px] font-extrabold text-[#8E92A0] tracking-[0.2em] uppercase mt-1">
              PROJECTS
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Cinematic Banner Card ───────────────────────────── */}
      <motion.div variants={staggerItem}>
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#00B5FF] via-[#A832FF] to-[#B53CFF] p-6 text-white shadow-[0_10px_30px_rgba(168,50,255,0.35)]">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10 space-y-3">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Ready to Create Something Cinematic?
            </h3>
            <p className="text-xs sm:text-sm text-white/85 font-medium max-w-sm">
              Professional speed-graded custom reels delivered back inside 60 minutes.
            </p>
            <button
              onClick={() => {
                if (packages.length > 0 && !selectedPackage) {
                  setSelectedPackage(packages[0]);
                }
                setCurrentView("booking");
              }}
              className="mt-2 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-extrabold text-xs shadow-lg hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-black text-black" />
              <span>Book a Session</span>
            </button>
          </div>
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