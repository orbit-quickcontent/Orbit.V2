"use client";

/**
 * 🔵 CLIENT FRONTEND | BottomNav
 * 
 * Floating pill-shaped bottom navigation with 4 tabs,
 * gradient active states, profile avatar thumbnail, and smooth animations.
 * 
 * Layout: Home | Packages | Track | Profile
 * 
 * Used by: client-app.tsx
 * Category: Client UI
 */

import { motion } from "framer-motion";
import { Home, Package, Radar } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { type AppView } from "@/lib/types";
import { getInitials } from "@/lib/utils";

const NAV_ITEMS: { icon: React.ElementType; label: string; view: AppView; isProfile?: boolean }[] = [
  { icon: Home, label: "Home", view: "landing" },
  { icon: Package, label: "Packages", view: "packages" },
  { icon: Radar, label: "Track", view: "tracking" },
  { icon: null as unknown as React.ElementType, label: "Profile", view: "profile", isProfile: true },
];

export function BottomNav() {
  const { currentView, setCurrentView, user, currentBooking } = useAppStore();

  const getIsActive = (view: AppView) => currentView === view;

  const avatarInitial = getInitials(user.name);
  const avatarGradient = user.avatar || "from-orbit-cyan to-orbit-purple";

  // Render avatar based on type (color gradient, image, or photo)
  const renderNavAvatar = (size: string, textSize: string) => {
    if (user.avatarType === "photo" && user.avatarPhotoUrl) {
      return (
        <div className={`${size} rounded-full overflow-hidden`}>
          <img src={user.avatarPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden`}>
          <img src={user.avatarImage} alt="Profile" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarEmoji) {
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-orbit-purple/20 to-orbit-cyan/20 flex items-center justify-center ${textSize}`}>
          {user.avatarEmoji}
        </div>
      );
    }
    return (
      <div className={`${size} rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center ${textSize} font-bold text-white`}>
        {avatarInitial}
      </div>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="px-3 sm:px-4 pb-[env(safe-area-inset-bottom,8px)] pt-1">
        <div className="orbit-nav-pill max-w-md mx-auto">
          <div className="flex items-center justify-around h-[52px] sm:h-[56px] relative">
            {NAV_ITEMS.map((item) => {
              const isActive = getIsActive(item.view);

              // ─── Profile Tab ────────────────────────────
              if (item.isProfile) {
                return (
                  <button
                    key={item.view}
                    onClick={() => setCurrentView(item.view)}
                    className="relative flex flex-col items-center justify-center gap-0.5 w-14 sm:w-18 h-full group"
                  >
                    {/* Active bg */}
                    {isActive && (
                      <motion.div
                        layoutId="navActiveBg"
                        className="absolute inset-x-1.5 inset-y-2 rounded-2xl bg-gradient-to-br from-orbit-purple/15 to-pink-500/10"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}

                    <div className="relative z-10">
                      <div
                        className={`transition-all duration-200 ${
                          isActive
                            ? "scale-110 ring-2 ring-orbit-purple/40"
                            : "opacity-60 group-hover:opacity-100 group-hover:scale-105"
                        }`}
                      >
                        {renderNavAvatar("w-5 h-5 sm:w-6 sm:h-6", "text-[8px] sm:text-[10px]")}
                      </div>
                    </div>

                    <span
                      className={`relative z-10 text-[8px] sm:text-[10px] leading-tight transition-colors duration-200 ${
                        isActive
                          ? "text-orbit-purple font-bold"
                          : "text-muted-foreground/40 font-medium group-hover:text-muted-foreground/70"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              }

              // ─── Regular Tabs ───────────────────────────
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className="relative flex flex-col items-center justify-center gap-0.5 w-14 sm:w-18 h-full group"
                >
                  {/* Active bg */}
                  {isActive && (
                    <motion.div
                      layoutId="navActiveBg"
                      className="absolute inset-x-1.5 inset-y-2 rounded-2xl bg-gradient-to-br from-orbit-cyan/15 to-orbit-purple/10"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10">
                    <Icon
                      className={`w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] transition-all duration-200 ${
                        isActive
                          ? "text-orbit-cyan scale-105"
                          : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </div>

                  <span
                    className={`relative z-10 text-[8px] sm:text-[10px] leading-tight transition-colors duration-200 ${
                      isActive
                        ? "text-orbit-cyan font-bold"
                        : "text-muted-foreground/40 font-medium group-hover:text-muted-foreground/70"
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Track badge — only for active (non-completed) bookings */}
                  {item.view === "tracking" && currentBooking && !["DELIVERED", "CANCELLED"].includes(currentBooking.status) && (
                    <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse z-20" />
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