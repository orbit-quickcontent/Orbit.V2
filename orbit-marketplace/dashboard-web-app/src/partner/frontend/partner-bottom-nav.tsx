"use client";

/**
 * 🟣 PARTNER FRONTEND | PartnerBottomNav
 *
 * Bottom navigation with 4 tabs: Home, Work, Earnings, Profile
 * Each tab navigates to its own view in the partner app.
 *
 * Used by: partner-app.tsx
 * Category: Partner UI
 */

import { motion } from "framer-motion";
import { LayoutDashboard, Briefcase, Wallet, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getInitials } from "@/lib/utils";
import { type AppView } from "@/lib/types";

const NAV_ITEMS: {
  icon: React.ElementType;
  label: string;
  view: AppView;
  isProfile?: boolean;
}[] = [
  { icon: LayoutDashboard, label: "Home", view: "partner" },
  { icon: Briefcase, label: "Work", view: "partner-work" },
  { icon: Wallet, label: "Earnings", view: "partner-earnings" },
  { icon: User, label: "Profile", view: "profile", isProfile: true },
];

export function PartnerBottomNav() {
  const { currentView, setCurrentView, user, partnerActiveBooking } = useAppStore();

  const getIsActive = (view: AppView) => {
    if (view === "partner") return currentView === "partner";
    if (view === "partner-work") return currentView === "partner-work";
    if (view === "partner-earnings") return currentView === "partner-earnings";
    if (view === "profile") return currentView === "profile";
    return false;
  };

  const avatarGradient = user.avatar || "from-orbit-purple to-orbit-cyan";
  const initials = getInitials(user.name);

  const renderNavAvatar = (size: string, textSize: string) => {
    if (user.avatarType === "photo" && user.avatarPhotoUrl) {
      return (
        <div className={`${size} rounded-full overflow-hidden`}>
          <img src={user.avatarPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarEmoji) {
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-orbit-purple/20 to-orbit-cyan/20 backdrop-blur-sm flex items-center justify-center ${textSize}`}>
          {user.avatarEmoji}
        </div>
      );
    }
    return (
      <div className={`${size} rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center ${textSize} font-bold text-white`}>
        {initials}
      </div>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 pb-[env(safe-area-inset-bottom,8px)] pt-1">
        <div className="orbit-nav-pill max-w-lg mx-auto">
          <div className="flex items-center justify-around h-[52px] sm:h-[56px] relative">
            {NAV_ITEMS.map((navItem, idx) => {
              const isActive = getIsActive(navItem.view);
              const Icon = navItem.icon;

              // ─── Profile Tab ────────────────────────────
              if (navItem.isProfile) {
                return (
                  <button
                    key={navItem.view}
                    onClick={() => setCurrentView(navItem.view)}
                    className="relative flex flex-col items-center justify-center gap-0.5 w-14 sm:w-18 h-full group"
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="partnerNavIndicator"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-gradient-to-r from-orbit-purple to-orbit-cyan"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}

                    <div className={`relative z-10 transition-all duration-200 ${
                      isActive
                        ? "ring-2 ring-white/30 scale-110"
                        : "opacity-50 group-hover:opacity-80 group-hover:scale-105"
                    }`}>
                      {renderNavAvatar("w-5 h-5 sm:w-6 sm:h-6", "text-[8px] sm:text-[10px]")}
                    </div>

                    <span
                      className={`relative z-10 text-[8px] sm:text-[10px] leading-tight transition-colors duration-200 ${
                        isActive
                          ? "text-foreground font-bold"
                          : "text-muted-foreground/40 font-medium group-hover:text-muted-foreground/70"
                      }`}
                    >
                      {navItem.label}
                    </span>
                  </button>
                );
              }

              // ─── Regular Tabs ───────────────────────────
              return (
                <button
                  key={navItem.label + idx}
                  onClick={() => setCurrentView(navItem.view)}
                  className="relative flex flex-col items-center justify-center gap-0.5 w-14 sm:w-18 h-full group"
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="partnerNavIndicator"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-gradient-to-r from-orbit-cyan to-orbit-purple"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-br from-orbit-cyan/15 to-orbit-purple/15 scale-105"
                          : "group-hover:bg-white/[0.04] group-hover:scale-105"
                      }`}
                    >
                      <Icon
                        className={`w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] transition-all duration-200 ${
                          isActive
                            ? navItem.view === "partner-earnings"
                              ? "text-green-400"
                              : navItem.view === "partner-work"
                                ? "text-green-400"
                                : "text-orbit-cyan"
                            : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>
                  </div>

                  <span
                    className={`relative z-10 text-[8px] sm:text-[10px] leading-tight transition-colors duration-200 ${
                      isActive
                        ? "text-foreground font-bold"
                        : "text-muted-foreground/40 font-medium group-hover:text-muted-foreground/70"
                    }`}
                  >
                    {navItem.label}
                  </span>

                  {/* Work badge — shows when active booking */}
                  {navItem.label === "Work" && partnerActiveBooking && (
                    <div className="absolute top-0.5 right-3 sm:right-4 w-2 h-2 rounded-full bg-orbit-purple animate-pulse z-20" />
                  )}

                  {/* Earnings dot */}
                  {navItem.label === "Earnings" && (
                    <div className="absolute top-0.5 right-3 sm:right-4 w-2 h-2 rounded-full bg-green-400 z-20" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}