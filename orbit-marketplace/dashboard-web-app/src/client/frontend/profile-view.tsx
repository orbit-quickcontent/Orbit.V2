"use client";

/**
 * CLIENT FRONTEND | ProfileView
 *
 * User profile page showing avatar, name, email, phone,
 * booking stats, download history, and settings.
 * Instagram-style profile layout with full avatar editing
 * (Color, Avatar, Photo) and booking management.
 *
 * Used by: client-app.tsx
 * Category: Client UI
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import {
  AVATAR_COLORS,
  AVATAR_PRESETS,
  isWithinRedownloadWindow,
  getRedownloadDaysRemaining,
} from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

type EditAvatarMode = "color" | "avatar" | "photo";
type BookingTab = "total" | "active" | "done";

export function ProfileView() {
  const { user, setUser, logout, bookings, reviews, cancelBooking } =
    useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingTab | null>(null);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editAvatarMode, setEditAvatarMode] = useState<EditAvatarMode>(
    user.avatarType === "photo"
      ? "photo"
      : user.avatarType === "avatar"
      ? "avatar"
      : "color"
  );
  const [editAvatar, setEditAvatar] = useState(
    (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "") >= 0
      ? (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "")
      : 0
  );
  const [editAvatarPreset, setEditAvatarPreset] = useState<string | null>(
    AVATAR_PRESETS.find((p) => p.emoji === user.avatarEmoji)?.id ?? null
  );
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(
    user.avatarPhotoUrl
  );
  const photoInputRef = useRef<HTMLInputElement>(null);

  const avatarGradient = user.avatar || "from-orbit-cyan to-orbit-purple";
  const initials = getInitials(user.name);

  // Render avatar based on type
  const renderProfileAvatar = (size: string, textSize: string) => {
    if (user.avatarType === "photo" && user.avatarPhotoUrl) {
      return (
        <div className={`${size} rounded-full overflow-hidden shadow-xl`}>
          <img
            src={user.avatarPhotoUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden shadow-xl ring-2 ring-white/10`}>
          <img
            src={user.avatarImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarEmoji) {
      return (
        <div
          className={`${size} rounded-full bg-gradient-to-br from-orbit-purple/20 to-orbit-cyan/20 backdrop-blur-sm flex items-center justify-center ${textSize} shadow-xl`}
        >
          {user.avatarEmoji}
        </div>
      );
    }
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center ${textSize} font-black text-white shadow-xl`}
      >
        {initials}
      </div>
    );
  };

  // Render edit-mode avatar preview
  const renderEditAvatarPreview = () => {
    if (editAvatarMode === "photo" && editPhotoPreview) {
      return (
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl">
          <img
            src={editPhotoPreview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    if (editAvatarMode === "avatar" && editAvatarPreset) {
      const preset = AVATAR_PRESETS.find((p) => p.id === editAvatarPreset);
      if (preset) {
        return (
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl ring-1 ring-white/10">
            <img src={preset.image} alt={preset.label} className="w-full h-full object-cover" />
          </div>
        );
      }
    }
    return (
      <div
        className={`w-16 h-16 rounded-full bg-gradient-to-br ${AVATAR_COLORS[editAvatar]} flex items-center justify-center text-xl font-black text-white shadow-xl`}
      >
        {editName ? editName[0].toUpperCase() : "?"}
      </div>
    );
  };

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
  const completedBookings = completedBookingsList.length;
  const activeBookings = activeBookingsList.length;

  // Get filtered bookings based on active tab
  const filteredBookings =
    activeTab === "total" ? bookings :
    activeTab === "active" ? activeBookingsList :
    completedBookingsList;

  const handleSave = useCallback(() => {
    const updates: Partial<typeof user> = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
    };

    if (editAvatarMode === "photo") {
      updates.avatarType = "photo";
      updates.avatarEmoji = null;
      updates.avatarPhotoUrl = editPhotoPreview;
      updates.avatar = null;
      updates.avatarImage = null;
    } else if (editAvatarMode === "avatar") {
      const preset = AVATAR_PRESETS.find((p) => p.id === editAvatarPreset);
      updates.avatarType = "avatar";
      updates.avatarEmoji = preset?.emoji ?? null;
      updates.avatarPhotoUrl = null;
      updates.avatar = preset?.gradient ?? null;
      updates.avatarImage = preset?.image ?? null;
    } else {
      updates.avatarType = "color";
      updates.avatarEmoji = null;
      updates.avatarPhotoUrl = null;
      updates.avatar = AVATAR_COLORS[editAvatar];
      updates.avatarImage = null;
    }

    setUser(updates);
    setIsEditing(false);
    toast.success("Profile updated!");
  }, [
    editName,
    editEmail,
    editPhone,
    editAvatarMode,
    editAvatarPreset,
    editPhotoPreview,
    editAvatar,
    setUser,
  ]);

  const handleCancel = useCallback(() => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    const idx = (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "");
    setEditAvatar(idx >= 0 ? idx : 0);
    setEditAvatarMode(
      user.avatarType === "photo"
        ? "photo"
        : user.avatarType === "avatar"
        ? "avatar"
        : "color"
    );
    setEditAvatarPreset(
      AVATAR_PRESETS.find((p) => p.emoji === user.avatarEmoji)?.id ?? null
    );
    setEditPhotoPreview(user.avatarPhotoUrl);
    setIsEditing(false);
  }, [user.name, user.email, user.phone, user.avatar, user.avatarType, user.avatarEmoji, user.avatarPhotoUrl]);

  const handleCancelBooking = useCallback(
    (bookingId: string) => {
      if (confirm("Are you sure you want to cancel this booking?")) {
        cancelBooking(bookingId, "CLIENT");
        toast.success("Booking cancelled successfully.");
      }
    },
    [cancelBooking]
  );

  const menuItems = [
    {
      icon: <Shield className="w-4 h-4" />,
      label: "Privacy & Security",
      desc: "Manage data and permissions",
    },
    {
      icon: <Settings className="w-4 h-4" />,
      label: "App Settings",
      desc: "Notifications, language, theme",
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      label: "Help & Support",
      desc: "FAQs, contact, report",
    },
  ];

  return (
    <div className="pb-4">
      {/* Profile Header - Compact */}
      <div className="orbit-card rounded-xl p-3 sm:p-4 mb-2">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            {renderProfileAvatar(
              "w-14 h-14 sm:w-16 sm:h-16",
              "text-lg sm:text-xl"
            )}
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#000000]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-foreground truncate">
              {user.name || "Orbit User"}
            </h2>
            <p className="text-[11px] text-muted-foreground truncate">
              {user.email || "No email set"}
            </p>
            {user.phone && (
              <p className="text-[10px] text-muted-foreground/70 truncate">
                {user.phone}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge
                variant="outline"
                className="border-orbit-cyan/30 text-orbit-cyan text-[8px] px-1.5 py-0"
              >
                <Film className="w-2.5 h-2.5 mr-0.5" /> Client
              </Badge>
              {user.location && (
                <Badge
                  variant="outline"
                  className="border-orbit-border text-muted-foreground text-[8px] px-1.5 py-0"
                >
                  <MapPin className="w-2.5 h-2.5 mr-0.5" /> {user.location}
                </Badge>
              )}
            </div>
          </div>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="border-orbit-border text-muted-foreground hover:text-foreground hover:border-orbit-cyan/30 h-8 text-[10px] shrink-0"
          >
            {isEditing ? (
              <X className="w-3 h-3 mr-0.5" />
            ) : (
              <Edit3 className="w-3 h-3 mr-0.5" />
            )}
            {isEditing ? "Close" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Total Video — Compact Card + Tab-Filtered Details */}
      {bookings.length > 0 && (
        <div className="mb-2">
          {/* Compact TOTAL Card */}
          <button
            onClick={() => setActiveTab(activeTab ? null : "total")}
            className="w-full orbit-card rounded-xl p-2.5 sm:p-3 text-center transition-all duration-300 active:scale-[0.99] hover:border-orbit-cyan/20"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-md bg-orbit-cyan/10 flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-orbit-cyan" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {bookings.length}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                Bookings
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-300 ${
                  activeTab ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Tab Bar: Total | Active | Done */}
          <AnimatePresence>
            {activeTab && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1 mt-1.5 p-0.5 bg-white/[0.03] rounded-lg">
                  {([
                    { key: "total" as BookingTab, label: "All", count: bookings.length },
                    { key: "active" as BookingTab, label: "Active", count: activeBookings },
                    { key: "done" as BookingTab, label: "Done", count: completedBookings },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        activeTab === tab.key
                          ? "bg-orbit-cyan/15 text-orbit-cyan"
                          : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03]"
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-0.5 text-[8px] ${
                        activeTab === tab.key
                          ? "text-orbit-cyan/60"
                          : "text-muted-foreground/40"
                      }`}>
                        ({tab.count})
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expandable Detail List (filtered by active tab) */}
          <AnimatePresence mode="wait">
            {activeTab && filteredBookings.length > 0 && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 space-y-1 max-h-52 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,191,255,0.15) transparent" }}>
                  {filteredBookings
                    .slice()
                    .reverse()
                    .map((b) => {
                      const isActive = !["DELIVERED", "CANCELLED"].includes(b.status);
                      const isDelivered = b.status === "DELIVERED";
                      const isCancelled = b.status === "CANCELLED";
                      const canCancel = isActive && ["PAID", "PARTNER_DISPATCHED", "EN_ROUTE"].includes(b.status);
                      const withinWindow = isDelivered && isWithinRedownloadWindow(b.deliveredAt);
                      const daysLeft = isDelivered ? getRedownloadDaysRemaining(b.deliveredAt) : 0;

                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between bg-white/[0.03] rounded-lg px-2.5 py-2"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                isDelivered
                                  ? "bg-green-500/10 text-green-400"
                                  : isCancelled
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-orbit-cyan/10 text-orbit-cyan"
                              }`}
                            >
                              {isDelivered ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : isCancelled ? (
                                <X className="w-3 h-3" />
                              ) : (
                                <Film className="w-3 h-3" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-medium text-foreground truncate">
                                {b.packageName}
                              </div>
                              <div className="text-[9px] text-muted-foreground/60">
                                {new Date(b.bookingDate).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}{" "}
                                · {b.timeSlot}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isDelivered && withinWindow && !b.downloaded && (
                              <Button
                                size="sm"
                                className="h-5 px-1.5 text-[8px] bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90"
                              >
                                <Download className="w-2.5 h-2.5 mr-0.5" /> Save
                              </Button>
                            )}
                            {isDelivered && b.downloaded && (
                              <span className="text-[8px] text-green-400/60">
                                {daysLeft}d
                              </span>
                            )}
                            {isDelivered && !withinWindow && (
                              <span className="text-[8px] text-muted-foreground/40">Expired</span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[7px] sm:text-[8px] ${
                                isDelivered
                                  ? "border-green-400/30 text-green-400"
                                  : isCancelled
                                  ? "border-red-400/30 text-red-400"
                                  : "border-orbit-cyan/30 text-orbit-cyan"
                              }`}
                            >
                              {b.status}
                            </Badge>
                            {canCancel && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCancelBooking(b.id); }}
                                className="h-5 px-1.5 text-[8px] border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="orbit-card rounded-xl p-4 sm:p-5 space-y-3 mb-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Edit Profile
              </h3>

              {/* Avatar preview */}
              <div className="flex items-center justify-center gap-4 mb-2">
                {renderEditAvatarPreview()}
              </div>

              {/* Avatar mode tabs */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  onClick={() => setEditAvatarMode("color")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    editAvatarMode === "color"
                      ? "bg-orbit-cyan/20 text-orbit-cyan"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  <Palette className="w-3 h-3" /> Color
                </button>
                <button
                  onClick={() => setEditAvatarMode("avatar")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    editAvatarMode === "avatar"
                      ? "bg-orbit-cyan/20 text-orbit-cyan"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  <UserCircle className="w-3 h-3" /> Avatar
                </button>
                <button
                  onClick={() => setEditAvatarMode("photo")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    editAvatarMode === "photo"
                      ? "bg-orbit-cyan/20 text-orbit-cyan"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  <ImageIcon className="w-3 h-3" /> Photo
                </button>
              </div>

              {/* Color picker */}
              {editAvatarMode === "color" && (
                <div className="flex items-center justify-center gap-3 mb-2">
                  {AVATAR_COLORS.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setEditAvatar(i)}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${color} transition-all duration-200 ${
                        editAvatar === i
                          ? "scale-125 ring-2 ring-white/50 ring-offset-2 ring-offset-[#000000]"
                          : "opacity-50 hover:opacity-100 hover:scale-110"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Avatar preset picker */}
              {editAvatarMode === "avatar" && (
                <div className="flex items-center justify-center gap-3 mb-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setEditAvatarPreset(preset.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                        editAvatarPreset === preset.id
                          ? "bg-orbit-cyan/10 ring-1 ring-orbit-cyan/40"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10"
                      >
                        <img src={preset.image} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Photo upload */}
              {editAvatarMode === "photo" && (
                <div className="flex flex-col items-center gap-3 mb-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  {editPhotoPreview ? (
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl">
                        <img
                          src={editPhotoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orbit-cyan flex items-center justify-center text-white shadow-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-orbit-border flex items-center justify-center text-muted-foreground hover:border-orbit-cyan/40 hover:text-orbit-cyan transition-colors"
                    >
                      <ImageIcon className="w-6 h-6" />
                    </button>
                  )}
                  <p className="text-[10px] text-muted-foreground/50">
                    Tap to upload a photo
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Edit3 className="w-3 h-3" /> Name
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-white/5 border-orbit-border text-foreground h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <Input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    type="email"
                    className="bg-white/5 border-orbit-border text-foreground h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    type="tel"
                    className="bg-white/5 border-orbit-border text-foreground h-10"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-orbit-border text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!editName.trim() || !editEmail.trim()}
                  className="flex-1 bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90"
                >
                  <Check className="w-4 h-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <div className="orbit-card rounded-xl overflow-hidden mb-2">
        {menuItems.map((item, i) => (
          <div key={i}>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.03] transition-colors text-left">
              <span className="text-orbit-cyan">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">
                  {item.label}
                </div>
                <div className="text-[10px] text-muted-foreground/60">
                  {item.desc}
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
            </button>
            {i < menuItems.length - 1 && (
              <Separator className="bg-orbit-border/30" />
            )}
          </div>
        ))}
      </div>

      {/* Logout */}
      <Button
        onClick={logout}
        variant="outline"
        className="w-full border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/30 h-10 text-xs"
      >
        <LogOut className="w-3.5 h-3.5 mr-1.5" />
        Log Out
      </Button>
    </div>
  );
}