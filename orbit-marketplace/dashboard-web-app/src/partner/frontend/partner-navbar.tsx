"use client";

/**
 * 🟣 PARTNER FRONTEND | PartnerNavbar
 *
 * Personalized greeting header for partners (matching client style).
 * Shows avatar, "Hi, {Name}", PARTNER badge, earnings indicator,
 * online/offline toggle, and notification bell.
 *
 * Used by: partner-app.tsx
 * Category: Partner UI
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Settings, ChevronDown, Search, Wallet, X, MapPin, FileText, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { getInitials, getGreeting } from "@/lib/utils";

export function PartnerNavbar() {
  const { user, setUser, toggleOnline, partnerActiveBooking, bookings, logout, setCurrentView } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter bookings for search
  const searchableBookings = bookings.filter((b) => {
    // When offline, don't show available work (PENDING / PARTNER_DISPATCHED) in results
    if (!user.isOnline && (b.status === "PENDING" || b.status === "PARTNER_DISPATCHED")) {
      return false;
    }
    return true;
  });

  const searchResults = searchQuery.trim()
    ? searchableBookings.filter((b) => {
        const q = searchQuery.toLowerCase();
        return (
          b.id.toLowerCase().includes(q) ||
          b.packageName.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q) ||
          b.notes.toLowerCase().includes(q)
        );
      })
    : [];

  const handleSearchSelect = useCallback(
    (booking: (typeof bookings)[number]) => {
      setSearchOpen(false);
      setSearchQuery("");
      // Navigate to the right view based on status
      if (booking.status === "DELIVERED" || booking.status === "CANCELLED") {
        setCurrentView("partner-earnings");
      } else {
        setCurrentView("partner");
      }
    },
    [setCurrentView]
  );

  // Close search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    if (searchOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [searchOpen]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchOpen]);

  // Auto-focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const avatarGradient = user.avatar || "from-orbit-purple to-orbit-cyan";
  const initials = getInitials(user.name);

  const renderAvatar = (size: string, textSize: string) => {
    if (user.avatarType === "photo" && user.avatarPhotoUrl) {
      return (
        <div className={`${size} rounded-full overflow-hidden shadow-lg`}>
          <img src={user.avatarPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden shadow-lg ring-1 ring-white/10`}>
          <img src={user.avatarImage} alt="Profile" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarEmoji) {
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-orbit-purple/20 to-orbit-cyan/20 backdrop-blur-sm flex items-center justify-center ${textSize} shadow-lg`}>
          {user.avatarEmoji}
        </div>
      );
    }
    return (
      <div className={`${size} rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center ${textSize} font-bold text-white shadow-lg`}>
        {initials}
      </div>
    );
  };

  const firstName = user.name ? user.name.split(" ")[0] : "there";

  // Only count truly active bookings for notifications
  // Suppress notifications when partner is offline - they shouldn't see new work alerts
  const hasActiveWork = !!partnerActiveBooking;
  const unreadNotifications = user.isOnline && hasActiveWork ? 1 : 0;

  const handleToggleOnline = () => {
    toggleOnline();
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#000000] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2.5 sm:py-3">
            {/* Left: Avatar + Greeting */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button className="relative group">
                <div className="transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
                  {renderAvatar("w-9 h-9 sm:w-11 sm:h-11", "text-xs sm:text-sm")}
                </div>
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#000000] ${user.isOnline ? "bg-green-400" : "bg-gray-400"}`} />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground/70 font-medium">
                    {getGreeting()}
                  </p>
                  <Badge variant="outline" className="border-orbit-purple/30 text-orbit-purple text-[8px] sm:text-[9px] px-1.5 py-0">
                    PARTNER
                  </Badge>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                  Hi, {firstName}
                </h1>
              </div>
            </div>

            {/* Right: Search + Online Toggle + Notification + Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => { setSearchOpen(true); setMenuOpen(false); }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.08] backdrop-blur-lg flex items-center justify-center text-muted-foreground hover:text-orbit-purple hover:bg-white/10 transition-all duration-200"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Online/Offline Toggle */}
              <button
                onClick={handleToggleOnline}
                className="flex items-center gap-1.5 h-9 sm:h-10 px-2.5 rounded-full bg-white/[0.08] backdrop-blur-lg hover:bg-white/10 transition-all duration-200"
                title={user.isOnline ? "Go Offline" : "Go Online"}
              >
                <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${user.isOnline ? "bg-green-400" : "bg-gray-400"}`} />
                <span className={`text-[11px] sm:text-xs font-medium transition-colors duration-200 ${user.isOnline ? "text-green-400" : "text-gray-400"}`}>
                  {user.isOnline ? "Online" : "Offline"}
                </span>
              </button>

              <button
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.08] backdrop-blur-lg flex items-center justify-center text-muted-foreground hover:text-orbit-purple hover:bg-white/10 transition-all duration-200"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden w-10 h-10 rounded-full bg-white/[0.08] backdrop-blur-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Subtitle / Status line */}
          <div className="pb-2 sm:pb-3 flex items-center gap-2">
            {hasActiveWork ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orbit-purple animate-pulse" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  You have an{" "}
                  <span className="text-orbit-purple font-semibold">
                    active shoot
                  </span>
                </p>
              </div>
            ) : user.isOnline ? (
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-green-400" />
                <p className="text-[10px] sm:text-xs text-muted-foreground/70">
                  Ready for your next gig
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <p className="text-[10px] sm:text-xs text-muted-foreground/70">
                  You&apos;re offline — won&apos;t receive new bookings
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            ref={searchRef}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 right-4 sm:left-6 sm:right-6 top-16 sm:top-20 z-[70]"
          >
            <div className="bg-[#0A0A0A]/95 backdrop-blur-lg border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <Search className="w-4 h-4 text-orbit-cyan shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookings by ID, package, location, notes…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Results */}
              {searchQuery.trim() && (
                <div className="max-h-72 overflow-y-auto p-2 custom-scrollbar">
                  {searchResults.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground/60">No bookings found</p>
                      <p className="text-xs text-muted-foreground/40 mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    searchResults.map((booking) => {
                      const isActive = !["DELIVERED", "CANCELLED"].includes(booking.status);
                      return (
                        <button
                          key={booking.id}
                          onClick={() => handleSearchSelect(booking)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isActive ? "bg-orbit-purple/10" : "bg-white/[0.04]"}`}>
                            <Package className={`w-4 h-4 ${isActive ? "text-orbit-purple" : "text-muted-foreground/60"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{booking.packageName}</p>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${isActive ? "bg-orbit-purple/10 text-orbit-purple" : "bg-white/[0.04] text-muted-foreground/60"}`}>
                                {booking.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {booking.location && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground/60 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" />{booking.location}
                                </span>
                              )}
                              {booking.notes && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground/40 truncate">
                                  <FileText className="w-3 h-3 shrink-0" />{booking.notes}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground/30 mt-0.5 font-mono">{booking.id}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Hint when empty query */}
              {!searchQuery.trim() && (
                <div className="py-4 px-4">
                  <p className="text-xs text-muted-foreground/40 text-center">
                    Type to search across {searchableBookings.length} booking{searchableBookings.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 sm:right-6 top-20 sm:top-24 w-56 bg-[#0A0A0A]/95 backdrop-blur-lg border border-orbit-border/40 rounded-2xl overflow-hidden shadow-2xl z-[60]"
          >
            <div className="p-2">
              {hasActiveWork && (
                <button
                  onClick={() => {
                    setCurrentView("partner");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-orbit-purple/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-orbit-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Shoot</p>
                    <p className="text-xs text-muted-foreground">1 in progress</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setCurrentView("profile");
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-orbit-cyan/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-orbit-cyan" />
                </div>
                <div>
                  <p className="text-sm font-medium">Settings</p>
                  <p className="text-xs text-muted-foreground">Profile & preferences</p>
                </div>
              </button>

              <div className="h-px bg-orbit-border/30 my-1" />

              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-400">Log Out</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}