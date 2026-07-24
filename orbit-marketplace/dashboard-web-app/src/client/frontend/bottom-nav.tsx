"use client";

/**
 * 🔵 CLIENT FRONTEND | BottomNav
 * 
 * Floating dark glass pill navigation bar matching Figma design.
 * Features rounded card active state, top gradient indicator bar,
 * glassmorphism backdrop, and smooth Framer Motion spring physics.
 * 
 * Layout: Home | Packages | Track | Profile
 */

import { motion } from "framer-motion";
import { Home, Package, Target } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { type AppView } from "@/lib/types";
import { getInitials } from "@/lib/utils";

type NavItem = {
  icon: React.ElementType | null;
  label: string;
  view: AppView;
  isProfile?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: "Home", view: "landing" },
  { icon: Package, label: "Packages", view: "packages" },
  { icon: Target, label: "Track", view: "tracking" },
  { icon: null, label: "Profile", view: "profile", isProfile: true },
];

export function BottomNav() {
  const { currentView, setCurrentView, user, currentBooking } = useAppStore();
  const avatarInitial = getInitials(user.name) || "TU";

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-[#0a0a0e]/90 backdrop-blur-xl border border-white/10 rounded-[28px] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between relative h-14 px-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.view;
            const Icon = item.icon;

            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className="relative flex-1 flex flex-col items-center justify-center h-full rounded-2xl transition-all duration-200 group"
              >
                {/* Active Card Container & Top Gradient Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-[#171622] border border-white/10 rounded-2xl shadow-inner overflow-hidden"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  >
                    {/* Top gradient line indicator */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-gradient-to-r from-[#00F0FF] to-[#A056FF] rounded-full shadow-[0_0_8px_#00F0FF]" />
                  </motion.div>
                )}

                {/* Icon Rendering */}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  {item.isProfile ? (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-[#00F0FF] to-[#A056FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    >
                      {avatarInitial}
                    </div>
                  ) : (
                    Icon && (
                      <Icon
                        className={`w-5 h-5 transition-all duration-200 ${
                          isActive
                            ? "text-[#00F0FF] scale-110 drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        }`}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    )
                  )}

                  {/* Label */}
                  <span
                    className={`text-[10px] font-semibold tracking-tight transition-colors duration-200 ${
                      isActive ? "text-[#00F0FF]" : "text-zinc-400 group-hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Active Tracking Dot Badge */}
                {item.view === "tracking" &&
                  currentBooking &&
                  !["DELIVERED", "CANCELLED"].includes(currentBooking.status) && (
                    <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-[#00F0FF] animate-ping z-20" />
                  )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}