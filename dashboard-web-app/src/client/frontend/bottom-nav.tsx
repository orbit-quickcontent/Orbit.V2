"use client";

/**
 * 🔵 CLIENT FRONTEND | BottomNav
 * 
 * Floating liquid glass pill navigation bar matching Figma & user SVG backdrop filter design.
 * Features rounded card active state, liquid glass inner highlights, top gradient indicator bar,
 * glassmorphism backdrop filter, and smooth Framer Motion spring physics.
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
      {/* Hidden SVG Filter for Liquid Glass Backdrop Effect */}
      <svg style={{ display: "none" }}>
        <filter id="liquid-glass-filter" colorInterpolationFilters="linearRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
          <feDisplacementMap in="SourceGraphic" in2="SourceGraphic" scale="12" xChannelSelector="R" yChannelSelector="B" x="0%" y="0%" width="100%" height="100%" result="displacementMap" />
          <feGaussianBlur stdDeviation="2 2" x="0%" y="0%" width="100%" height="100%" in="displacementMap" edgeMode="none" result="blur" />
        </filter>
      </svg>

      <div 
        className="pointer-events-auto w-full max-w-md bg-[rgba(15,17,21,0.85)] backdrop-blur-2xl border border-white/10 rounded-[32px] p-1.5 shadow-[inset_1.5px_1.5px_1px_0_rgba(255,255,255,0.2),inset_-1.5px_-1.5px_2px_1px_rgba(255,255,255,0.05),0_12px_40px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center justify-between relative h-14 px-1">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = currentView === item.view;
            const Icon = item.icon;
            const isFirst = idx === 0;
            const isLast = idx === NAV_ITEMS.length - 1;

            const cornerRadiusClass = isFirst
              ? "rounded-l-[26px] rounded-r-2xl"
              : isLast
              ? "rounded-l-2xl rounded-r-[26px]"
              : "rounded-2xl";

            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className="relative flex-1 flex flex-col items-center justify-center h-full rounded-2xl transition-all duration-300 group cursor-pointer active:scale-95 hover:scale-[1.03]"
              >
                {/* Active Liquid Glass Pill Container & Top Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className={`absolute inset-0 bg-white/10 border border-white/20 ${cornerRadiusClass} shadow-[inset_1.5px_1.5px_1px_0_rgba(255,255,255,0.25),0_4px_16px_rgba(0,0,0,0.4)] overflow-hidden`}
                    transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.8 }}
                  >
                    {/* Top monochrome line indicator */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  </motion.div>
                )}

                {/* Icon & Label Rendering */}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  {item.isProfile ? (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200 ${
                        isActive
                          ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                          : "bg-[#1E2029] border border-white/10 text-[#8E92A0] group-hover:text-zinc-200"
                      }`}
                    >
                      {avatarInitial}
                    </div>
                  ) : (
                    Icon && (
                      <Icon
                        className={`w-5 h-5 transition-all duration-200 ${
                          isActive
                            ? "text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                            : "text-[#8E92A0] group-hover:text-zinc-200"
                        }`}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    )
                  )}

                  {/* Label */}
                  <span
                    className={`text-[10px] font-semibold tracking-tight transition-colors duration-200 ${
                      isActive ? "text-white" : "text-[#8E92A0] group-hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Active Tracking Dot Badge */}
                {item.view === "tracking" &&
                  currentBooking &&
                  !["DELIVERED", "CANCELLED"].includes(currentBooking.status) && (
                    <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-white animate-ping z-20" />
                  )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}