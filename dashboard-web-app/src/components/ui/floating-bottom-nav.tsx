"use client";

import React from "react";
import { Home, Package, Target } from "lucide-react";

export interface FloatingBottomNavProps {
  activeTab: "home" | "packages" | "tracking" | "profile";
  onSelectTab: (tab: "home" | "packages" | "tracking" | "profile") => void;
  userInitials?: string;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onSelectTab,
  userInitials = "GC",
}) => {
  const tabs = [
    { key: "home", label: "Home", icon: Home },
    { key: "packages", label: "Packages", icon: Package },
    { key: "tracking", label: "Track", icon: Target },
    { key: "profile", label: "Profile", icon: null },
  ] as const;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-auto">
      <div className="bg-[#0F1015] border border-[#22242E] rounded-[36px] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center justify-between relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`relative flex-1 py-2.5 px-3 rounded-[26px] flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-[#222530] border border-[#333748] shadow-lg"
                  : "hover:bg-white/5 opacity-70 hover:opacity-100"
              }`}
            >
              {/* White Glowing Top Bar for Active Tab */}
              {isActive && (
                <>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3px] bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)]" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-gradient-to-b from-white/30 to-transparent blur-sm pointer-events-none" />
                </>
              )}

              {/* Icon / Avatar */}
              {tab.key === "profile" ? (
                <div className="w-5 h-5 rounded-full bg-white text-[#0F1015] flex items-center justify-center text-[10px] font-black tracking-tighter shadow-sm">
                  {userInitials}
                </div>
              ) : Icon ? (
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-white" : "text-[#8E92A0]"
                  }`}
                />
              ) : null}

              {/* Label */}
              <span
                className={`text-[11px] font-semibold tracking-tight transition-colors ${
                  isActive ? "text-white font-bold" : "text-[#8E92A0]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingBottomNav;
