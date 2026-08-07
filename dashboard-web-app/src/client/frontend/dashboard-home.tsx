"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CalendarCheck, Radar, Package, ArrowRight, CheckCircle2,
  ChevronRight, ChevronDown, Clock, Star, Flame, TrendingUp,
  Users, MapPin, Sparkles, Play, Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";

type BookingTab = "total" | "active" | "done";

function compactStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending", PAID: "Paid", PARTNER_DISPATCHED: "Dispatched",
    EN_ROUTE: "En Route", SHOOTING: "Shooting", SYNCING: "Syncing",
    EDITING: "Editing", DELIVERED: "Delivered", CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

export function DashboardHome() {
  const { currentBooking, bookings, packages, setCurrentView, selectedPackage, setSelectedPackage, setHighlightedPackageId } = useAppStore();
  const [activeTab, setActiveTab] = useState<BookingTab | null>(null);
  // Loss Aversion — countdown timer
  const [slotSeconds, setSlotSeconds] = useState(299);
  useEffect(() => {
    const t = setInterval(() => setSlotSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const slotTimer = `${Math.floor(slotSeconds / 60)}:${String(slotSeconds % 60).padStart(2, "0")}`;

  const completedBookingsList = bookings.filter(b => b.status === "DELIVERED");
  const activeBookingsList = bookings.filter(b => !["DELIVERED", "CANCELLED"].includes(b.status));
  const filteredBookings = activeTab === "total" ? bookings : activeTab === "active" ? activeBookingsList : completedBookingsList;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 sm:space-y-5">

      {/* ── Principle 3: Reciprocity — value before commitment ── */}
      <motion.div variants={staggerItem}>
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-950/60 to-purple-950/40 rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-400/40 animate-ping" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Creators available near you right now</p>
                <p className="text-xs text-slate-400 mt-0.5">Browse portfolios & pricing — no account needed</p>
              </div>
            </div>
            <div className="shrink-0 bg-cyan-400/10 border border-cyan-400/30 rounded-lg px-2.5 py-1">
              <span className="text-xs font-black text-cyan-400">3 LIVE</span>
            </div>
          </div>
          {/* Loss aversion timer */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-orange-400 font-bold">Slot expires in {slotTimer}</span>
            <span className="text-slate-500">— book now to secure your creator</span>
          </div>
        </div>
      </motion.div>

      {/* ── Principle 1: Smart Defaults chips ── */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#0A0C14] rounded-2xl p-3.5 border border-white/5">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-black text-cyan-400 tracking-wider uppercase">Recommended for Instagram Reels</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["30 min", "4K HDR", "Wireless Mic ✓", "UPI Ready ✓", "10 min delivery"].map(chip => (
              <span key={chip} className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/50 border border-cyan-500/20 rounded-full px-3 py-1">
                {chip}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Pre-selected based on top creator bookings</p>
        </div>
      </motion.div>

      {/* ── Quick Actions Grid ── */}
      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <CalendarCheck className="w-5 h-5 text-cyan-400" />, label: "Book Now", desc: "Schedule a session", bg: "bg-cyan-950/40 border-cyan-500/20", onClick: () => { if (packages.length > 0 && !selectedPackage) setSelectedPackage(packages[0]); setCurrentView("booking"); } },
            { icon: <Radar className="w-5 h-5 text-purple-400" />, label: "Track Order", desc: activeBookingsList.length > 0 ? `${activeBookingsList.length} active` : "No active", bg: "bg-purple-950/40 border-purple-500/20", onClick: () => setCurrentView("tracking") },
            { icon: <Package className="w-5 h-5 text-emerald-400" />, label: "Packages", desc: "View pricing", bg: "bg-emerald-950/40 border-emerald-500/20", onClick: () => setCurrentView("packages") },
            { icon: <Zap className="w-5 h-5 text-amber-400" />, label: "Brand DNA", desc: "Customize style", bg: "bg-amber-950/40 border-amber-500/20", onClick: () => { const ugcPkg = packages.find(p => p.tier === "PROFESSIONAL" || p.id === "pkg-professional"); if (ugcPkg) { setSelectedPackage(ugcPkg); setHighlightedPackageId(ugcPkg.id); } setCurrentView("packages"); } },
          ].map((action, i) => (
            <button key={i} onClick={action.onClick}
              className="group bg-[#0D0D11] rounded-2xl p-4 text-left border border-white/5 hover:border-cyan-500/30 transition-all duration-300 active:scale-[0.98] flex flex-col justify-between min-h-[116px]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${action.bg} group-hover:scale-105 transition-transform duration-300`}>
                {action.icon}
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-bold text-white truncate">{action.label}</h3>
                <p className="text-xs text-slate-500 truncate mt-1">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Packages with Contrast Effect (Principle 6) ── */}
      <motion.div variants={staggerItem} className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Our Packages</h3>
          <button onClick={() => setCurrentView("packages")} className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => { if (packages[0]) setSelectedPackage(packages[0]); setCurrentView("booking"); }}
            className="bg-[#0C1014] rounded-2xl p-4 text-left border border-slate-800 hover:border-cyan-500/40 transition-all group">
            <h4 className="text-base font-bold text-white">Personalized</h4>
            <p className="text-xl font-black text-cyan-400 mt-1">₹1,999<span className="text-sm font-normal text-slate-500">/session</span></p>
            <div className="mt-3 space-y-1.5">
              {["1 Cinematic Reel", "4K HDR", "Wireless Mic"].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}
                </div>
              ))}
            </div>
            {/* Contrast Effect add-on */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-[10px] text-cyan-400 font-semibold">+ Studio Mic for just ₹99 more</p>
            </div>
          </button>

          <button onClick={() => { const ugc = packages.find(p => p.tier === "PROFESSIONAL") || packages[1]; if (ugc) setSelectedPackage(ugc); setCurrentView("booking"); }}
            className="bg-[#130E1A] rounded-2xl p-4 text-left border border-purple-900/60 hover:border-purple-500/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black px-2.5 py-1 rounded-bl-xl">POPULAR</div>
            <h4 className="text-base font-bold text-white pr-16">Professional (UGC)</h4>
            <p className="text-xl font-black text-cyan-400 mt-1">₹4,999<span className="text-sm font-normal text-slate-500">/session</span></p>
            <div className="mt-3 space-y-1.5">
              {["3 Cinematic Reels", "Brand DNA", "Priority Queue"].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />{f}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-purple-900/30">
              <p className="text-[10px] text-purple-400 font-semibold">+ Cinematic Lighting for just ₹149</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* ── Admin Dashboard Psychology: positive framing stats ── */}
      <motion.div variants={staggerItem}>
        <div className="bg-[#0D0D10] rounded-2xl p-4 border border-white/5 grid grid-cols-3 text-center divide-x divide-white/5">
          <div>
            <p className="text-base font-extrabold text-cyan-400">60 min</p>
            <p className="text-[10px] text-slate-500">Avg Delivery</p>
          </div>
          <div>
            <p className="text-base font-extrabold text-emerald-400">89%</p>
            <p className="text-[10px] text-slate-500">SLA Met</p>
          </div>
          <div>
            <p className="text-base font-extrabold text-purple-400">500+</p>
            <p className="text-[10px] text-slate-500">Reels Delivered</p>
          </div>
        </div>
      </motion.div>

      {/* ── Loss Aversion CTA ── */}
      <motion.div variants={staggerItem}>
        <div className="rounded-2xl overflow-hidden border border-orange-500/20">
          <div className="bg-gradient-to-r from-orange-950/60 to-red-950/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-black text-white">2 creators nearby may become unavailable</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Current slot expires in <span className="text-orange-400 font-bold">{slotTimer}</span></p>
            <div className="flex gap-2">
              <button onClick={() => { if (packages.length > 0 && !selectedPackage) setSelectedPackage(packages[0]); setCurrentView("booking"); }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black py-2.5 rounded-xl hover:opacity-90 transition">
                Book Now →
              </button>
              <button onClick={() => { if (packages.length > 0 && !selectedPackage) setSelectedPackage(packages[0]); setCurrentView("booking"); }}
                className="flex-1 text-slate-500 text-xs font-medium py-2.5 rounded-xl border border-white/5 hover:border-white/10 transition">
                I'll Risk Missing This Slot
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Booking History ── */}
      <motion.div variants={staggerItem} className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <h3 className="text-base font-black text-white">Booking History</h3>
        </div>
        {bookings.length === 0 ? (
          <div className="bg-[#0D0D11] rounded-2xl p-6 border border-white/5 text-center">
            <Play className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No bookings yet — create your first reel</p>
            <button onClick={() => setCurrentView("booking")} className="mt-3 text-xs font-bold text-cyan-400 hover:underline">Book Now →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {(filteredBookings.length ? filteredBookings : bookings).slice(0, 3).map(b => (
              <div key={b.id} onClick={() => setCurrentView("tracking")}
                className="bg-[#0D0D11] rounded-xl p-4 border border-white/5 hover:border-cyan-500/20 transition cursor-pointer flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{b.package?.name || "Shoot"}</p>
                  <p className="text-xs text-slate-500 truncate">{b.location || "Mumbai"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${b.status === "DELIVERED" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"}`}>
                    {compactStatus(b.status)}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Trust & Safety ── */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 bg-[#0A0F0A] rounded-2xl p-4 border border-emerald-900/30">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">Orbit Trust & Safety</p>
            <p className="text-[10px] text-slate-500">All creators verified • Secure payments • 100% delivery guarantee</p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
