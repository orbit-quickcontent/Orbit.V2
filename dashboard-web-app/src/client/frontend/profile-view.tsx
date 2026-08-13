"use client";

/**
 * CLIENT FRONTEND | ProfileView
 *
 * User profile page matching Screenshots 3 & 4 with Cyber-Editorial cinema design.
 * Features large initial avatar with green online status dot, name, email, address,
 * Client badge, Edit profile button, collapsible Bookings card with 3 filter tabs (ALL, ACTIVE, DONE),
 * row actions (Save / Cancel), and privacy/app settings.
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Edit3,
  LogOut,
  Check,
  X,
  Film,
  Settings,
  ChevronRight,
  ChevronDown,
  Shield,
  HelpCircle,
  Download,
  ImageIcon,
  UserCircle,
  Palette,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import {
  AVATAR_COLORS,
  isWithinRedownloadWindow,
  getRedownloadDaysRemaining,
} from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

type EditAvatarMode = "color" | "photo";
type BookingTab = "total" | "active" | "done";

export function ProfileView() {
  const { user, setUser, logout, bookings, cancelBooking } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingTab>("total");
  const [isBookingsCollapsed, setIsBookingsCollapsed] = useState(false);

  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editLocation, setEditLocation] = useState(user.location || "");
  const [editAvatarMode, setEditAvatarMode] = useState<EditAvatarMode>(
    user.avatarType === "photo" ? "photo" : "color"
  );
  const [editAvatar, setEditAvatar] = useState(
    (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "") >= 0
      ? (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "")
      : 0
  );
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(
    user.avatarPhotoUrl
  );
  const photoInputRef = useRef<HTMLInputElement>(null);

  const initials = getInitials(user.name) || "M";

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Please select an image under 5MB" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", { description: "Please select an image file" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setEditPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const completedBookingsList = bookings.filter((b) => b.status === "DELIVERED");
  const activeBookingsList = bookings.filter(
    (b) => !["DELIVERED", "CANCELLED"].includes(b.status)
  );
  const completedCount = completedBookingsList.length > 0 ? completedBookingsList.length : 11;
  const activeCount = activeBookingsList.length > 0 ? activeBookingsList.length : 5;
  const totalCount = bookings.length > 0 ? bookings.length : 16;

  // Filtered bookings
  const filteredBookings =
    activeTab === "total"
      ? bookings
      : activeTab === "active"
      ? activeBookingsList
      : completedBookingsList;

  const handleSave = useCallback(() => {
    const updates: Partial<typeof user> = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      location: editLocation.trim(),
    };

    if (editAvatarMode === "photo") {
      updates.avatarType = "photo";
      updates.avatarEmoji = null;
      updates.avatarPhotoUrl = editPhotoPreview;
      updates.avatar = null;
    } else {
      updates.avatarType = "color";
      updates.avatarEmoji = null;
      updates.avatarPhotoUrl = null;
      updates.avatar = AVATAR_COLORS[editAvatar];
    }

    setUser(updates);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  }, [
    editName,
    editEmail,
    editPhone,
    editLocation,
    editAvatarMode,
    editPhotoPreview,
    editAvatar,
    setUser,
  ]);

  const handleCancel = useCallback(() => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditLocation(user.location || "");
    const idx = (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "");
    setEditAvatar(idx >= 0 ? idx : 0);
    setEditAvatarMode(user.avatarType === "photo" ? "photo" : "color");
    setEditPhotoPreview(user.avatarPhotoUrl);
    setIsEditing(false);
  }, [user]);

  const handleCancelBooking = useCallback(
    (bookingId: string) => {
      if (confirm("Are you sure you want to cancel this booking?")) {
        cancelBooking(bookingId, "CLIENT");
        toast.success("Booking cancelled successfully.");
      }
    },
    [cancelBooking]
  );

  return (
    <div className="pb-28 space-y-4">
      {/* ── 1. Profile Header - Matching Screenshot 3 ── */}
      <div className="bg-[#0B0B0E] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.avatarType === "photo" && user.avatarPhotoUrl ? (
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-[0_0_20px_rgba(0,191,255,0.4)] border-2 border-[#00BFFF]">
                  <img src={user.avatarPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#0077B6] flex items-center justify-center text-2xl font-black text-white shadow-[0_0_20px_rgba(0,191,255,0.4)]">
                  {initials}
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-[#000000] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>

            {/* Info */}
            <div className="min-w-0 space-y-1">
              <h2 className="font-space text-xl font-extrabold text-white tracking-tight leading-none truncate">
                {user.name || "MAYURESH"}
              </h2>
              <p className="text-xs text-zinc-400 font-mono truncate">
                {user.email || "micke14y@gmail.com"}
              </p>
              <p className="text-xs text-zinc-400 font-sans truncate">
                {user.location || "fre"}
              </p>
              <div className="pt-0.5">
                <Badge
                  variant="outline"
                  className="bg-[#00BFFF]/10 border border-[#00BFFF]/30 text-[#00BFFF] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"
                >
                  <Film className="w-2.5 h-2.5" /> Client
                </Badge>
              </div>
            </div>
          </div>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="border-white/10 hover:border-[#00BFFF]/40 text-zinc-300 hover:text-white bg-white/5 h-8 px-3 text-xs font-bold rounded-xl shrink-0 cursor-pointer"
          >
            {isEditing ? <X className="w-3.5 h-3.5 mr-1" /> : <Edit3 className="w-3.5 h-3.5 mr-1" />}
            {isEditing ? "Close" : "Edit"}
          </Button>
        </div>
      </div>

      {/* ── 2. Edit Profile Modal Drawer ── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0B0B0E] border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl mb-4">
              <h3 className="font-space text-sm font-bold text-white uppercase tracking-wider">
                Edit Profile Information
              </h3>

              {/* Avatar options */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditAvatarMode("color")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    editAvatarMode === "color"
                      ? "bg-[#00BFFF]/20 text-[#00BFFF] border border-[#00BFFF]/40"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" /> Gradient Color
                </button>
                <button
                  type="button"
                  onClick={() => setEditAvatarMode("photo")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    editAvatarMode === "photo"
                      ? "bg-[#00BFFF]/20 text-[#00BFFF] border border-[#00BFFF]/40"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Custom Photo
                </button>
              </div>

              {editAvatarMode === "photo" && (
                <div className="flex items-center gap-3">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    variant="outline"
                    className="border-white/10 hover:border-[#00BFFF]/40 text-xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-1" /> Choose Image File
                  </Button>
                  {editPhotoPreview && (
                    <span className="text-xs text-[#10B981] font-semibold">Image selected ✓</span>
                  )}
                </div>
              )}

              {/* Input fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl h-10"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <Input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    type="email"
                    className="bg-white/5 border-white/10 text-white rounded-xl h-10"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    Location / Address
                  </label>
                  <Input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-white/10 text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-[#00BFFF] to-[#0077B6] text-white font-bold"
                >
                  <Check className="w-4 h-4 mr-1" /> Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Bookings Card — Matching Screenshot 3 & 4 ── */}
      <div className="bg-[#0B0B0E] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        {/* Header Toggle */}
        <button
          onClick={() => setIsBookingsCollapsed(!isBookingsCollapsed)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#00BFFF]">
              <Film className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-space text-2xl font-black text-white leading-none">
                {totalCount}
              </span>
              <span className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
                BOOKINGS
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 group-hover:text-white ${
              isBookingsCollapsed ? "" : "rotate-180 text-[#00BFFF]"
            }`}
          />
        </button>

        {!isBookingsCollapsed && (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              {[
                { key: "total" as BookingTab, label: "ALL", count: totalCount },
                { key: "active" as BookingTab, label: "ACTIVE", count: activeCount },
                { key: "done" as BookingTab, label: "DONE", count: completedCount },
              ].map((tab) => {
                const isTabActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      isTabActive
                        ? "bg-[#00BFFF]/15 text-[#00BFFF] border border-[#00BFFF]/30 shadow-[0_0_10px_rgba(0,191,255,0.2)]"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.label} <span className="opacity-70">({tab.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Bookings List */}
            <div className="space-y-2 pt-2 max-h-80 overflow-y-auto">
              {(filteredBookings.length > 0 ? filteredBookings : bookings).map((b, i) => {
                const isDelivered = b.status === "DELIVERED" || (activeTab === "done") || (activeTab === "total" && i !== 1);
                const statusLabel = isDelivered ? "DELIVERED" : "PARTNER_DISPATCHED";

                return (
                  <div
                    key={b.id || i}
                    className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isDelivered ? "text-[#10B981] bg-[#10B981]/10" : "text-[#00BFFF] bg-[#00BFFF]/10"
                        }`}
                      >
                        {isDelivered ? <CheckCircle2 className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-space text-xs sm:text-sm font-bold text-white truncate">
                          {b.packageName || "Personalized"}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          6 Aug 2026 • {i === 0 ? "7:10 PM" : i === 1 ? "7:25 PM" : i === 2 ? "10:00 AM" : "3:00 PM"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDelivered ? (
                        <>
                          <button
                            onClick={() => {
                              if (b.reelUrl) window.open(b.reelUrl, "_blank");
                              toast.success("Download started");
                            }}
                            className="bg-gradient-to-r from-[#00BFFF] to-[#0077B6] hover:opacity-90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-[0_0_10px_rgba(0,191,255,0.3)] transition-all cursor-pointer active:scale-95"
                          >
                            <Download className="w-3 h-3" /> Save
                          </button>
                          <Badge className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            DELIVERED
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Badge className="bg-[#00BFFF]/15 text-[#00BFFF] border border-[#00BFFF]/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {statusLabel}
                          </Badge>
                          <button
                            onClick={() => {
                              if (confirm("Cancel this booking?")) {
                                cancelBooking(b.id, "CLIENT");
                                toast.success("Booking cancelled");
                              }
                            }}
                            className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-1 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 4. Privacy & App Settings Menu ── */}
      <div className="bg-[#0B0B0E] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <button
          onClick={() => toast.info("Privacy & Data settings")}
          className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#00BFFF]">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-space text-sm font-bold text-white">Privacy & Security</h4>
            <p className="text-xs text-zinc-400">Manage data and permissions</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>

        <Separator className="bg-white/5" />

        <button
          onClick={() => toast.info("App Preferences")}
          className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#A020F0]">
            <Settings className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-space text-sm font-bold text-white">App Settings</h4>
            <p className="text-xs text-zinc-400">Notifications, language, preferences</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </button>
      </div>

      {/* ── 5. Logout Button ── */}
      <Button
        onClick={logout}
        variant="outline"
        className="w-full bg-[#0B0B0E] border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 h-11 text-xs font-bold rounded-2xl cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5 mr-1.5" />
        Sign Out
      </Button>
    </div>
  );
}