"use client";

/**
 * CLIENT FRONTEND | ClientNavbar
 * 
 * Personalized greeting header inspired by modern app dashboards.
 * Shows user avatar, greeting ("Hi, {Name}"), subtitle, and notification bell.
 * Includes functional search bar with suggestions and notification panel.
 * No traditional nav links — navigation is handled by BottomNav.
 * 
 * Used by: client-app.tsx
 * Category: Client UI
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Settings, ChevronDown, Search, X, CheckCircle2, CreditCard, Clock, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { getInitials, getGreeting } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: "booking" | "payment" | "status" | "delivery";
};

export function ClientNavbar() {
  const { user, currentBooking, bookings, logout, setCurrentView } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const avatarGradient = user.avatar || "from-orbit-cyan to-orbit-purple";
  const initials = getInitials(user.name);

  // Render avatar based on type (color gradient, image, or photo)
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
  const activeBookings = bookings.filter(
    (b) => !["DELIVERED", "CANCELLED"].includes(b.status)
  ).length;
  const hasActiveBooking = currentBooking
    ? !["DELIVERED", "CANCELLED"].includes(currentBooking.status)
    : false;
  // Generate notifications from bookings via useMemo
  const notifications = useMemo(() => {
    const notifs: NotificationItem[] = [];
    bookings.forEach((b) => {
      const isActive = !["DELIVERED", "CANCELLED"].includes(b.status);
      const bookingDate = new Date(b.bookingDate);
      const timeAgo = getTimeAgo(bookingDate);

      if (b.paymentStatus === "SUCCESS") {
        const id = `${b.id}-payment`;
        notifs.push({
          id,
          title: "Payment Confirmed",
          description: `${b.packageName} - Payment successful`,
          time: timeAgo,
          read: readNotifIds.has(id) || !isActive,
          icon: "payment",
        });
      }

      if (isActive) {
        const id = `${b.id}-status`;
        notifs.push({
          id,
          title: getStatusTitle(b.status),
          description: `${b.packageName} - ${b.status.replace(/_/g, " ")}`,
          time: timeAgo,
          read: readNotifIds.has(id),
          icon: "status",
        });
      }

      if (b.status === "DELIVERED") {
        const id = `${b.id}-delivered`;
        notifs.push({
          id,
          title: "Edit Delivered",
          description: `${b.packageName} - Your edit is ready!`,
          time: timeAgo,
          read: readNotifIds.has(id) || true,
          icon: "delivery",
        });
      }
    });
    return notifs.reverse();
  }, [bookings, readNotifIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close search/notif on outside click (mousedown + touchstart for mobile)
  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  // Close search on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const searchSuggestions = [
    { label: "Book a session", view: "packages" as const },
    { label: "Track my order", view: "tracking" as const },
    { label: "View packages", view: "packages" as const },
    { label: "My Profile", view: "profile" as const },
  ];

  const filteredSuggestions = searchQuery
    ? searchSuggestions.filter((s) =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchSuggestions;

  function markAllRead() {
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Solid background to prevent text overlap */}
      <div className="bg-[#000000] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2.5 sm:py-3">
            {/* Left: Avatar + Greeting */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Avatar */}
              <button
                onClick={() => setCurrentView("profile")}
                className="relative group"
              >
                <div className="transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
                  {renderAvatar("w-9 h-9 sm:w-11 sm:h-11", "text-xs sm:text-sm")}
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 border-2 border-[#000000]" />
              </button>

              {/* Greeting Text */}
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground/50 font-bold uppercase tracking-widest leading-none mb-1">
                  {getGreeting()}
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-white leading-none">
                    Hi, {firstName}
                  </h1>
                  <Badge className="bg-orbit-cyan/15 hover:bg-orbit-cyan/20 text-orbit-cyan border-none text-[8px] font-extrabold px-1.5 py-0.5 rounded-md leading-none uppercase tracking-wider">
                    Client
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: Search + Notification + Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search bar */}
              <div ref={searchRef} className="relative">
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="absolute right-0 top-0 z-10 flex items-center w-[260px] sm:w-[220px]"
                    >
                      <div className="w-full flex items-center gap-2 bg-white/[0.10] backdrop-blur-lg rounded-full px-3 h-10 sm:h-11 border border-white/10">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search..."
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search suggestions dropdown */}
                <AnimatePresence>
                  {searchOpen && filteredSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 sm:top-13 w-56 bg-[#0A0A0A]/95 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[70]"
                    >
                      <div className="p-2">
                        <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                          Quick Actions
                        </p>
                        {filteredSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentView(s.view);
                              setSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left text-sm text-foreground/80 hover:text-foreground"
                          >
                            <Search className="w-3.5 h-3.5 text-muted-foreground/50" />
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => {
                    setSearchOpen(!searchOpen);
                    setNotifOpen(false);
                    if (searchOpen) setSearchQuery("");
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.08] backdrop-blur-lg flex items-center justify-center text-muted-foreground hover:text-orbit-cyan hover:bg-white/10 transition-all duration-200"
                >
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Notification bell */}
              <div ref={notifRef} className="relative">
                <button
                  className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/[0.08] backdrop-blur-lg flex items-center justify-center text-muted-foreground hover:text-orbit-cyan hover:bg-white/10 transition-all duration-200"
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification panel */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-12 sm:top-13 w-72 max-w-[300px] bg-[#0A0A0A]/95 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[70]"
                    >
                      <div className="p-3 border-b border-white/5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-[11px] text-orbit-cyan hover:underline font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground/50">No new notifications</p>
                          </div>
                        ) : (
                          <div className="p-2">
                            {notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                                  notif.read
                                    ? "hover:bg-white/[0.02]"
                                    : "bg-white/[0.04] hover:bg-white/[0.06]"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    notif.icon === "payment"
                                      ? "bg-green-500/10 text-green-400"
                                      : notif.icon === "status"
                                      ? "bg-orbit-cyan/10 text-orbit-cyan"
                                      : notif.icon === "delivery"
                                      ? "bg-orbit-purple/10 text-orbit-purple"
                                      : "bg-white/5 text-muted-foreground"
                                  }`}
                                >
                                  {notif.icon === "payment" ? (
                                    <CreditCard className="w-4 h-4" />
                                  ) : notif.icon === "status" ? (
                                    <Film className="w-4 h-4" />
                                  ) : notif.icon === "delivery" ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <Clock className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-foreground truncate">
                                      {notif.title}
                                    </p>
                                    {!notif.read && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-orbit-cyan shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground/70 truncate">
                                    {notif.description}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                                    {notif.time}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick menu dropdown toggle (mobile) */}
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setSearchOpen(false);
                  setNotifOpen(false);
                }}
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
            {hasActiveBooking ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-orbit-cyan animate-pulse shrink-0" />
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Your edit is{" "}
                  <span
                    className="text-orbit-cyan font-semibold cursor-pointer hover:underline"
                    onClick={() => setCurrentView("tracking")}
                  >
                    being tracked
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground/60 truncate">
                Ready to create something cinematic?
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Menu (mobile) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 sm:right-6 top-[4.5rem] sm:top-[5.5rem] w-56 bg-[#0A0A0A]/95 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[60]"
          >
            <div className="p-2">
              {/* Notifications */}
              {activeBookings > 0 && (
                <button
                  onClick={() => {
                    setCurrentView("tracking");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-orbit-cyan/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-orbit-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Booking</p>
                    <p className="text-xs text-muted-foreground">
                      {activeBookings} in progress
                    </p>
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
                <div className="w-8 h-8 rounded-lg bg-orbit-purple/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-orbit-purple" />
                </div>
                <div>
                  <p className="text-sm font-medium">Settings</p>
                  <p className="text-xs text-muted-foreground">
                    Profile & preferences
                  </p>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusTitle(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Booking Confirmed",
    PAID: "Payment Received",
    PARTNER_DISPATCHED: "Partner Dispatched",
    EN_ROUTE: "Partner En Route",
    SHOOTING: "Shooting in Progress",
    SYNCING: "Media Syncing",
    EDITING: "Edit in Progress",
    DELIVERED: "Edit Delivered",
    CANCELLED: "Booking Cancelled",
  };
  return map[status] || "Booking Update";
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}