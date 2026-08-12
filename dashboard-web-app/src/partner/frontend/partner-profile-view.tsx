"use client";

/**
 * 🟣 PARTNER FRONTEND | PartnerProfileView
 *
 * Partner profile page with avatar-only editing (verified fields locked),
 * verification status badge, wallet balance, bank account section,
 * online/offline toggle, and logout.
 *
 * Used by: partner-app.tsx
 * Category: Partner UI
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Edit3,
  LogOut,
  Check,
  X,
  Camera,
  Clock,
  Star,
  Settings,
  ChevronRight,
  Shield,
  HelpCircle,
  Upload,
  Lock,
  Building2,
  Wallet,
  Eye,
  EyeOff,
  Plus,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { AVATAR_COLORS, AVATAR_PRESETS, formatCurrency } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import type { BankAccount } from "@/lib/types";

type EditAvatarMode = "color" | "avatar" | "photo";

/** Mask account number: show only last 4 digits */
function maskAccountNumber(accNum: string): string {
  if (accNum.length <= 4) return accNum;
  return "•••••" + accNum.slice(-4);
}

export function PartnerProfileView() {
  const { user, setUser, toggleOnline, logout, bookings, linkBankAccount, withdrawFromWallet, setCurrentView } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);

  // Avatar editing state
  const [editAvatar, setEditAvatar] = useState(
    (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "") >= 0
      ? (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "")
      : 0
  );
  const [editAvatarMode, setEditAvatarMode] = useState<EditAvatarMode>(
    user.avatarType === "photo" ? "photo" : user.avatarType === "avatar" ? "avatar" : "color"
  );
  const [editAvatarPreset, setEditAvatarPreset] = useState(
    AVATAR_PRESETS.findIndex((p) => p.emoji === user.avatarEmoji) >= 0
      ? AVATAR_PRESETS.findIndex((p) => p.emoji === user.avatarEmoji)
      : 0
  );
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(
    user.avatarPhotoUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bank linking state
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    pan: "",
  });
  const [bankLinkLoading, setBankLinkLoading] = useState(false);
  const [bankLinkError, setBankLinkError] = useState<string | null>(null);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawInput, setShowWithdrawInput] = useState(false);

  const avatarGradient = user.avatar || "from-orbit-purple to-orbit-cyan";
  const initials = getInitials(user.name);

  const wallet = user.wallet;
  const bankAccount = user.bankAccount;

  const renderProfileAvatar = (size: string, textSize: string) => {
    if (user.avatarType === "photo" && user.avatarPhotoUrl) {
      return (
        <div className={`${size} rounded-full overflow-hidden shadow-xl`}>
          <img src={user.avatarPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden shadow-xl ring-2 ring-white/10`}>
          <img src={user.avatarImage} alt="Profile" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (user.avatarType === "avatar" && user.avatarEmoji) {
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-orbit-purple/20 to-orbit-cyan/20 backdrop-blur-sm flex items-center justify-center ${textSize} shadow-xl`}>
          {user.avatarEmoji}
        </div>
      );
    }
    return (
      <div className={`${size} rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center ${textSize} font-black text-white shadow-xl`}>
        {initials}
      </div>
    );
  };

  const renderEditPreviewAvatar = () => {
    if (editAvatarMode === "photo" && editPhotoPreview) {
      return (
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl">
          <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (editAvatarMode === "avatar") {
      const preset = AVATAR_PRESETS[editAvatarPreset];
      return (
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl ring-1 ring-white/10">
          <img src={preset.image} alt={preset.label} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${AVATAR_COLORS[editAvatar]} flex items-center justify-center text-xl font-black text-white shadow-xl`}>
        {user.name ? user.name[0].toUpperCase() : "?"}
      </div>
    );
  };

  const completedBookings = bookings.filter((b) => b.status === "DELIVERED").length;
  const activeBookings = bookings.filter((b) => !["DELIVERED", "CANCELLED"].includes(b.status)).length;

  const handleSave = useCallback(() => {
    const updates: Record<string, unknown> = {};

    // Only save avatar changes — name/email/phone are locked
    if (editAvatarMode === "color") {
      updates.avatarType = "color";
      updates.avatar = AVATAR_COLORS[editAvatar];
      updates.avatarEmoji = null;
      updates.avatarPhotoUrl = null;
      updates.avatarImage = null;
    } else if (editAvatarMode === "avatar") {
      const preset = AVATAR_PRESETS[editAvatarPreset];
      updates.avatarType = "avatar";
      updates.avatar = preset.gradient;
      updates.avatarEmoji = preset.emoji;
      updates.avatarPhotoUrl = null;
      updates.avatarImage = preset.image;
    } else if (editAvatarMode === "photo") {
      updates.avatarType = "photo";
      updates.avatar = null;
      updates.avatarEmoji = null;
      updates.avatarPhotoUrl = editPhotoPreview;
      updates.avatarImage = null;
    }

    setUser(updates as Partial<typeof user>);
    setIsEditing(false);
  }, [editAvatar, editAvatarMode, editAvatarPreset, editPhotoPreview, setUser]);

  const handleCancel = useCallback(() => {
    const idx = (AVATAR_COLORS as readonly string[]).indexOf(user.avatar || "");
    setEditAvatar(idx >= 0 ? idx : 0);
    setEditAvatarMode(
      user.avatarType === "photo" ? "photo" : user.avatarType === "avatar" ? "avatar" : "color"
    );
    setEditAvatarPreset(
      AVATAR_PRESETS.findIndex((p) => p.emoji === user.avatarEmoji) >= 0
        ? AVATAR_PRESETS.findIndex((p) => p.emoji === user.avatarEmoji)
        : 0
    );
    setEditPhotoPreview(user.avatarPhotoUrl || null);
    setIsEditing(false);
  }, [user.avatar, user.avatarType, user.avatarEmoji, user.avatarPhotoUrl]);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const resetBankForm = useCallback(() => {
    setBankForm({ accountHolderName: "", accountNumber: "", confirmAccountNumber: "", ifscCode: "", pan: "" });
    setBankLinkError(null);
    setBankLinkLoading(false);
  }, []);

  const bankFormValid =
    bankForm.accountHolderName.trim().length > 2 &&
    bankForm.accountNumber.trim().length >= 9 &&
    bankForm.accountNumber.trim() === bankForm.confirmAccountNumber.trim() &&
    /^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifscCode.trim().toUpperCase()) &&
    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(bankForm.pan.trim().toUpperCase());

  const handleLinkBank = useCallback(async () => {
    if (!bankFormValid) return;
    setBankLinkLoading(true);
    setBankLinkError(null);
    try {
      const res = await fetch("/api/partners/link-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountHolderName: bankForm.accountHolderName.trim(),
          accountNumber: bankForm.accountNumber.trim(),
          ifsc: bankForm.ifscCode.trim().toUpperCase(),
          pan: bankForm.pan.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBankLinkError(data.error || "Verification failed. Please check your details.");
        return;
      }
      // Sync verified bank info back from API response into local store
      const { bankAccount: apiBankAccount } = data as { bankAccount?: { bankName: string; ifscCode: string; accountHolderName: string } };
      if (apiBankAccount) {
        linkBankAccount({
          id: `bank-${Date.now()}`,
          bankName: apiBankAccount.bankName,
          accountNumber: "•••• " + bankForm.accountNumber.slice(-4),
          ifscCode: apiBankAccount.ifscCode,
          accountHolderName: apiBankAccount.accountHolderName,
          isVerified: true,
          linkedAt: new Date().toISOString(),
        });
      }
      toast.success("Bank account linked and verified via Penny Drop ✓");
      setShowBankForm(false);
      resetBankForm();
    } catch {
      setBankLinkError("Network error. Please check your connection and retry.");
    } finally {
      setBankLinkLoading(false);
    }
  }, [bankForm, bankFormValid, linkBankAccount, resetBankForm]);

  const handleWithdraw = useCallback(() => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > wallet.balance) return;
    withdrawFromWallet(amount);
    setWithdrawAmount("");
    setShowWithdrawInput(false);
  }, [withdrawAmount, wallet.balance, withdrawFromWallet]);

  const menuItems = [
    { icon: <Shield className="w-4 h-4" />, label: "Privacy Shield", desc: "Client data protection", action: () => {} },
    { icon: <Settings className="w-4 h-4" />, label: "App Settings", desc: "Notifications, sync preferences", action: () => setCurrentView("partner-settings") },
    { icon: <HelpCircle className="w-4 h-4" />, label: "Help & Support", desc: "Guides, contact, report", action: () => {} },
  ];

  return (
    <div className="pb-4">
      {/* Profile Header - Compact */}
      <div className="orbit-card rounded-xl p-3 sm:p-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {renderProfileAvatar("w-14 h-14 sm:w-16 sm:h-16", "text-lg sm:text-xl")}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#000000] ${user.isOnline ? "bg-green-400" : "bg-gray-400"}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-foreground truncate">{user.name || "Orbit Partner"}</h2>
              {/* Verification Status Badge */}
              {user.isVerified ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[8px] px-1.5 py-0 gap-0.5">
                  <Shield className="w-2.5 h-2.5" /> Verified
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[8px] px-1.5 py-0 gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> Pending
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{user.email || "No email set"}</p>
            {user.phone && (
              <p className="text-[10px] text-muted-foreground/70 truncate">{user.phone}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge variant="outline" className="border-orbit-purple/30 text-orbit-purple text-[8px] px-1.5 py-0">
                <Camera className="w-2.5 h-2.5 mr-0.5" /> Partner
              </Badge>
              {/* Online/Offline Toggle */}
              <button
                onClick={() => toggleOnline()}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.08] border border-orbit-border/30 hover:bg-white/10 transition-all duration-200"
              >
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${user.isOnline ? "bg-green-400" : "bg-gray-400"}`} />
                <span className={`text-[9px] font-medium transition-colors duration-200 ${user.isOnline ? "text-green-400" : "text-gray-400"}`}>
                  {user.isOnline ? "Online" : "Offline"}
                </span>
              </button>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="border-orbit-border text-muted-foreground hover:text-foreground hover:border-orbit-purple/30 h-8 text-[10px] shrink-0"
          >
            {isEditing ? <X className="w-3 h-3 mr-0.5" /> : <Edit3 className="w-3 h-3 mr-0.5" />}
            {isEditing ? "Close" : "Edit"}
          </Button>
        </div>

        {/* Wallet Balance Row */}
        <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-orbit-purple/10 to-orbit-cyan/10 border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orbit-purple/20 to-orbit-cyan/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-orbit-cyan" />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Wallet Balance</p>
                <p className="text-base font-black text-foreground">{formatCurrency(wallet.balance)}</p>
              </div>
            </div>
            <div className="text-right">
              {wallet.pendingClearance > 0 && (
                <p className="text-[9px] text-amber-400/80">{formatCurrency(wallet.pendingClearance)} pending</p>
              )}
              {wallet.totalWithdrawn > 0 && (
                <p className="text-[8px] text-muted-foreground/50">Withdrawn: {formatCurrency(wallet.totalWithdrawn)}</p>
              )}
            </div>
          </div>
          {wallet.balance > 0 && (
            <div className="mt-2">
              {!showWithdrawInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWithdrawInput(true)}
                  className="w-full h-7 text-[10px] border-orbit-cyan/30 text-orbit-cyan hover:bg-orbit-cyan/10"
                >
                  <IndianRupee className="w-3 h-3 mr-1" /> Withdraw Funds
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 h-7 text-xs bg-white/5 border-orbit-border"
                    max={wallet.balance}
                    min={1}
                  />
                  <Button
                    size="sm"
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > wallet.balance}
                    className="h-7 text-[10px] bg-gradient-to-r from-orbit-purple to-orbit-cyan text-white hover:opacity-90"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowWithdrawInput(false); setWithdrawAmount(""); }}
                    className="h-7 text-[10px] border-orbit-border text-muted-foreground"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats - Compact */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <motion.div className="orbit-card rounded-xl p-2.5 text-center" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Camera className="w-4 h-4 text-orbit-purple mx-auto mb-1" />
          <div className="text-lg font-black text-foreground">{bookings.length}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Shoots</div>
        </motion.div>
        <motion.div className="orbit-card rounded-xl p-2.5 text-center" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Clock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="text-lg font-black text-foreground">{activeBookings}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Active</div>
        </motion.div>
        <motion.div className="orbit-card rounded-xl p-2.5 text-center" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Star className="w-4 h-4 text-orbit-cyan mx-auto mb-1" />
          <div className="text-lg font-black text-foreground">{completedBookings}</div>
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Done</div>
        </motion.div>
      </div>

      {/* Bank Account Section */}
      <div className="orbit-card rounded-xl p-3 sm:p-4 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-orbit-purple" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Bank Account</h3>
          {bankAccount && (
            <Badge className={`text-[8px] px-1.5 py-0 gap-0.5 ${bankAccount.isVerified ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"}`}>
              <Shield className="w-2.5 h-2.5" /> {bankAccount.isVerified ? "Verified" : "Pending"}
            </Badge>
          )}
        </div>

        {bankAccount ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div>
                <p className="text-xs font-medium text-foreground">{bankAccount.bankName || "Linked Bank"}</p>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider">{maskAccountNumber(bankAccount.accountNumber)}</p>
                <p className="text-[9px] text-muted-foreground/50">IFSC: {bankAccount.ifscCode}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-muted-foreground/50">{bankAccount.accountHolderName}</p>
                <p className="text-[8px] text-muted-foreground/40">Linked {new Date(bankAccount.linkedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {!showBankForm ? (
              <button
                onClick={() => setShowBankForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-orbit-purple/30 hover:border-orbit-purple/50 hover:bg-orbit-purple/5 transition-all duration-200"
              >
                <Plus className="w-4 h-4 text-orbit-purple" />
                <span className="text-xs text-orbit-purple font-medium">Link Bank Account</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                {/* Security notice */}
                <div className="flex items-start gap-2 p-2 rounded-lg bg-orbit-purple/5 border border-orbit-purple/20">
                  <Shield className="w-3.5 h-3.5 text-orbit-purple shrink-0 mt-0.5" />
                  <p className="text-[9px] text-muted-foreground/80">Details are verified via Penny Drop. Account number is encrypted with AES-256 before storage.</p>
                </div>

                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">Account Holder Name</label>
                  <Input
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                    placeholder="As per bank records"
                    className="bg-white/5 border-orbit-border text-foreground h-9 text-xs"
                    disabled={bankLinkLoading}
                  />
                </div>

                {/* Account Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">Account Number</label>
                  <Input
                    type="password"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                    className="bg-white/5 border-orbit-border text-foreground h-9 text-xs"
                    disabled={bankLinkLoading}
                  />
                </div>

                {/* Confirm Account Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Confirm Account Number
                    {bankForm.confirmAccountNumber && bankForm.accountNumber !== bankForm.confirmAccountNumber && (
                      <span className="text-red-400 text-[9px]">— Numbers don't match</span>
                    )}
                  </label>
                  <Input
                    value={bankForm.confirmAccountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                    placeholder="Re-enter account number"
                    className={`bg-white/5 border-orbit-border text-foreground h-9 text-xs ${
                      bankForm.confirmAccountNumber && bankForm.accountNumber !== bankForm.confirmAccountNumber
                        ? "border-red-500/50"
                        : ""
                    }`}
                    disabled={bankLinkLoading}
                  />
                </div>

                {/* IFSC Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    IFSC Code
                    {bankForm.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifscCode.toUpperCase()) && (
                      <span className="text-red-400 text-[9px]">— Invalid format</span>
                    )}
                  </label>
                  <Input
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    className="bg-white/5 border-orbit-border text-foreground h-9 text-xs font-mono tracking-wider"
                    disabled={bankLinkLoading}
                  />
                </div>

                {/* PAN Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    PAN Number
                    {bankForm.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(bankForm.pan.toUpperCase()) && (
                      <span className="text-red-400 text-[9px]">— Invalid format (e.g. ABCDE1234F)</span>
                    )}
                  </label>
                  <Input
                    value={bankForm.pan}
                    onChange={(e) => setBankForm({ ...bankForm, pan: e.target.value.toUpperCase() })}
                    placeholder="e.g. ABCDE1234F"
                    className="bg-white/5 border-orbit-border text-foreground h-9 text-xs font-mono tracking-wider"
                    disabled={bankLinkLoading}
                  />
                </div>

                {/* API Error */}
                {bankLinkError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                    <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-400">{bankLinkError}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowBankForm(false); resetBankForm(); }}
                    disabled={bankLinkLoading}
                    className="flex-1 border-orbit-border text-muted-foreground h-8 text-[10px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLinkBank}
                    disabled={!bankFormValid || bankLinkLoading}
                    className="flex-1 bg-gradient-to-r from-orbit-purple to-orbit-cyan text-white hover:opacity-90 h-8 text-[10px] disabled:opacity-50"
                  >
                    {bankLinkLoading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full mr-1.5"
                        />
                        Verifying...
                      </>
                    ) : (
                      <><Building2 className="w-3 h-3 mr-1" /> Verify & Link</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile — Avatar Only */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="orbit-card rounded-xl p-3 sm:p-4 space-y-2.5 mb-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Edit Avatar</h3>

              {/* Locked Fields Notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-medium text-amber-400">Contact Support to Change</p>
                  <p className="text-[9px] text-amber-400/60">Verified fields are locked for security</p>
                </div>
              </div>

              {/* Locked Profile Fields (Read-Only) */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <Lock className="w-2.5 h-2.5 text-amber-400/60" /> Name
                  </label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-muted-foreground text-xs">
                    <span className="flex-1 truncate">{user.name || "—"}</span>
                    <Lock className="w-3 h-3 text-muted-foreground/30" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <Lock className="w-2.5 h-2.5 text-amber-400/60" /> Email
                  </label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-muted-foreground text-xs">
                    <span className="flex-1 truncate">{user.email || "—"}</span>
                    <Lock className="w-3 h-3 text-muted-foreground/30" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <Lock className="w-2.5 h-2.5 text-amber-400/60" /> Phone
                  </label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-muted-foreground text-xs">
                    <span className="flex-1 truncate">{user.phone || "—"}</span>
                    <Lock className="w-3 h-3 text-muted-foreground/30" />
                  </div>
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Avatar Preview */}
              <div className="flex items-center justify-center mb-2">
                {renderEditPreviewAvatar()}
              </div>

              {/* Avatar Mode Tabs */}
              <div className="flex items-center justify-center gap-1 p-1 bg-white/[0.04] rounded-xl">
                {(["color", "avatar", "photo"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setEditAvatarMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      editAvatarMode === mode
                        ? "bg-white/[0.1] text-foreground"
                        : "text-muted-foreground/60 hover:text-muted-foreground"
                    }`}
                  >
                    {mode === "color" ? "Color" : mode === "avatar" ? "Avatar" : "Photo"}
                  </button>
                ))}
              </div>

              {/* Color Picker */}
              {editAvatarMode === "color" && (
                <div className="flex items-center justify-center gap-3">
                  {AVATAR_COLORS.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setEditAvatar(i)}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${color} transition-all duration-200 ${
                        editAvatar === i ? "scale-125 ring-2 ring-white/50 ring-offset-2 ring-offset-[#000000]" : "opacity-50 hover:opacity-100 hover:scale-110"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Avatar Presets */}
              {editAvatarMode === "avatar" && (
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_PRESETS.map((preset, i) => (
                    <button
                      key={preset.id}
                      onClick={() => setEditAvatarPreset(i)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                        editAvatarPreset === i
                          ? "bg-white/[0.1] ring-1 ring-orbit-purple/40"
                          : "bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
                        <img src={preset.image} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{preset.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Photo Upload */}
              {editAvatarMode === "photo" && (
                <div className="flex flex-col items-center gap-3">
                  {editPhotoPreview ? (
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-orbit-purple/30">
                        <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => setEditPhotoPreview(null)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-orbit-border/50 text-muted-foreground hover:text-foreground hover:border-orbit-purple/30"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {editPhotoPreview ? "Change Photo" : "Upload Photo"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground/50">Choose a photo from your gallery</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={handleCancel} variant="outline" className="flex-1 border-orbit-border text-muted-foreground">Cancel</Button>
                <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-orbit-purple to-orbit-cyan text-white hover:opacity-90">
                  <Check className="w-4 h-4 mr-1" /> Save Avatar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Items - Compact */}
      <div className="orbit-card rounded-xl overflow-hidden mb-2">
        {menuItems.map((item, i) => (
          <div key={i}>
            <button onClick={item.action} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.03] transition-colors text-left">
              <span className="text-orbit-purple">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">{item.label}</div>
                <div className="text-[10px] text-muted-foreground/60">{item.desc}</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
            </button>
            {i < menuItems.length - 1 && <Separator className="bg-orbit-border/30" />}
          </div>
        ))}
      </div>

      <Button onClick={logout} variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/30 h-10 text-xs">
        <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log Out
      </Button>
    </div>
  );
}