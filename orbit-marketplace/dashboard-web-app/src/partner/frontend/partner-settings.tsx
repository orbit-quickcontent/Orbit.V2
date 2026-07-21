"use client";

/**
 * PartnerSettings
 *
 * Full settings page for the partner app. Sections:
 * - Notification Settings
 * - Sync & Upload Settings
 * - Bank Account
 * - Wallet & Withdrawal
 * - Account & Security
 * - About
 *
 * Used by: partner-app.tsx
 * Category: Partner UI
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Wifi,
  Upload,
  MapPin,
  Building2,
  Wallet,
  Shield,
  Info,
  ChevronLeft,
  Check,
  AlertTriangle,
  Clock,
  ArrowDownToLine,
  ExternalLink,
  FileText,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "sonner";

export function PartnerSettings() {
  const {
    user,
    updatePartnerSettings,
    linkBankAccount,
    withdrawFromWallet,
    setCurrentView,
  } = useAppStore();

  const settings = user.settings;
  const bankAccount = user.bankAccount;
  const wallet = user.wallet;

  // Bank account form state
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [pan, setPan] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankLinkLoading, setBankLinkLoading] = useState(false);
  const [bankLinkError, setBankLinkError] = useState<string | null>(null);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawInput, setShowWithdrawInput] = useState(false);

  const resetBankForm = () => {
    setBankName("");
    setAccountNumber("");
    setConfirmAccountNumber("");
    setIfscCode("");
    setPan("");
    setAccountHolderName("");
    setBankLinkError(null);
    setBankLinkLoading(false);
  };

  const bankFormValid =
    accountHolderName.trim().length > 2 &&
    accountNumber.trim().length >= 9 &&
    accountNumber.trim() === confirmAccountNumber.trim() &&
    /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase()) &&
    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase());

  const handleLinkBank = async () => {
    if (!bankFormValid) {
      toast.error("Please fill in all bank details correctly");
      return;
    }
    setBankLinkLoading(true);
    setBankLinkError(null);
    try {
      const res = await fetch("/api/partners/link-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          ifsc: ifscCode.trim().toUpperCase(),
          pan: pan.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBankLinkError(data.error || "Verification failed. Check your details.");
        return;
      }
      // Sync verified bank info into store from API response
      const { bankAccount: apiBankAccount } = data as { bankAccount?: { bankName: string; ifscCode: string; accountHolderName: string } };
      linkBankAccount({
        id: `bank-${Date.now()}`,
        bankName: apiBankAccount?.bankName || bankName.trim(),
        accountNumber: "•••• " + accountNumber.slice(-4),
        ifscCode: apiBankAccount?.ifscCode || ifscCode.trim().toUpperCase(),
        accountHolderName: apiBankAccount?.accountHolderName || accountHolderName.trim(),
        isVerified: true,
        linkedAt: new Date().toISOString(),
      });
      setShowBankForm(false);
      resetBankForm();
      toast.success("Bank account verified and linked successfully ✓");
    } catch {
      setBankLinkError("Network error. Please check your connection and retry.");
    } finally {
      setBankLinkLoading(false);
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 500) {
      toast.error("Minimum withdrawal amount is ₹500");
      return;
    }
    if (amount > wallet.balance) {
      toast.error("Insufficient wallet balance");
      return;
    }
    if (!bankAccount) {
      toast.error("Link a bank account first to withdraw");
      return;
    }
    withdrawFromWallet(amount);
    setWithdrawAmount("");
    setShowWithdrawInput(false);
    toast.success(`₹${amount.toLocaleString("en-IN")} withdrawn successfully`);
  };

  const maskAccountNumber = (acc: string) => {
    if (acc.length <= 4) return acc;
    return "XXXX XXXX " + acc.slice(-4);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => setCurrentView("profile")}
            className="w-8 h-8 rounded-lg bg-white/[0.06] border border-orbit-border/30 flex items-center justify-center hover:bg-white/[0.1] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h2 className="text-lg font-black text-foreground">Settings</h2>
        </div>
      </motion.div>

      {/* ─── Notification Settings ─── */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl p-3 sm:p-4 border border-orbit-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orbit-purple/10 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-orbit-purple" />
            </div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Notifications
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">All Notifications</p>
                <p className="text-[10px] text-muted-foreground/60">Enable or disable all alerts</p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) =>
                  updatePartnerSettings({
                    notificationsEnabled: checked,
                    newBookingAlerts: checked ? settings.newBookingAlerts : false,
                    paymentAlerts: checked ? settings.paymentAlerts : false,
                  })
                }
              />
            </div>

            <Separator className="bg-orbit-border/20" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">New Booking Alerts</p>
                <p className="text-[10px] text-muted-foreground/60">Get notified when new work arrives</p>
              </div>
              <Switch
                checked={settings.newBookingAlerts}
                disabled={!settings.notificationsEnabled}
                onCheckedChange={(checked) =>
                  updatePartnerSettings({ newBookingAlerts: checked })
                }
              />
            </div>

            <Separator className="bg-orbit-border/20" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Payment Alerts</p>
                <p className="text-[10px] text-muted-foreground/60">Get notified on payment updates</p>
              </div>
              <Switch
                checked={settings.paymentAlerts}
                disabled={!settings.notificationsEnabled}
                onCheckedChange={(checked) =>
                  updatePartnerSettings({ paymentAlerts: checked })
                }
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Sync & Upload Settings ─── */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl p-3 sm:p-4 border border-orbit-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orbit-cyan/10 flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-orbit-cyan" />
            </div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Sync & Upload
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-muted-foreground/50" />
                <div>
                  <p className="text-xs font-medium text-foreground">Auto Sync on Wi-Fi Only</p>
                  <p className="text-[10px] text-muted-foreground/60">Save mobile data</p>
                </div>
              </div>
              <Switch
                checked={settings.autoSyncOnWifi}
                onCheckedChange={(checked) =>
                  updatePartnerSettings({ autoSyncOnWifi: checked })
                }
              />
            </div>

            <Separator className="bg-orbit-border/20" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-muted-foreground/50" />
                <div>
                  <p className="text-xs font-medium text-foreground">High Quality Upload</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {settings.highQualityUpload ? (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Uses more data
                        </span>
                      ) : (
                        "Larger files, more data"
                      )
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.highQualityUpload}
                onCheckedChange={(checked) =>
                  updatePartnerSettings({ highQualityUpload: checked })
                }
              />
            </div>

            <Separator className="bg-orbit-border/20" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground/50" />
                <div>
                  <p className="text-xs font-medium text-foreground">Location Tracking</p>
                  <p className="text-[10px] text-muted-foreground/60">For accurate shoot locations</p>
                </div>
              </div>
              <Switch
                checked={settings.locationTracking}
                onCheckedChange={(checked) =>
                  updatePartnerSettings({ locationTracking: checked })
                }
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Bank Account ─── */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl p-3 sm:p-4 border border-orbit-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-green-400" />
            </div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Bank Account
            </h3>
          </div>

          {bankAccount ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-foreground">{bankAccount.bankName}</p>
                  {bankAccount.isVerified ? (
                    <Badge variant="outline" className="border-green-500/30 text-green-400 text-[8px] px-1.5 py-0">
                      <Check className="w-2.5 h-2.5 mr-0.5" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-400/30 text-amber-400 text-[8px] px-1.5 py-0">
                      <Clock className="w-2.5 h-2.5 mr-0.5" /> Pending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono tracking-wider">
                  {maskAccountNumber(bankAccount.accountNumber)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {bankAccount.accountHolderName}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBankForm(true);
                }}
                className="w-full border-orbit-border/50 text-muted-foreground hover:text-foreground hover:border-orbit-purple/30 h-8 text-[11px]"
              >
                Change Bank Account
              </Button>
            </div>
          ) : (
            <div>
              {!showBankForm ? (
                <div className="text-center py-2">
                  <p className="text-[11px] text-muted-foreground/60 mb-3">
                    No bank account linked. Link one to enable withdrawals.
                  </p>
                  <Button
                    onClick={() => setShowBankForm(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 h-9 text-xs"
                  >
                    <Building2 className="w-3.5 h-3.5 mr-1.5" />
                    Link Bank Account
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {showBankForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2.5 mt-2"
            >
              {/* Security notice */}
              <div className="flex items-start gap-2 p-2 rounded-lg bg-orbit-purple/5 border border-orbit-purple/20">
                <Shield className="w-3.5 h-3.5 text-orbit-purple shrink-0 mt-0.5" />
                <p className="text-[9px] text-muted-foreground/80">Details are verified via Penny Drop. Account number is encrypted with AES-256 before storage.</p>
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Account Holder Name
                </label>
                <Input
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Name as per bank records"
                  className="bg-white/5 border-orbit-border text-foreground h-9 text-xs"
                  disabled={bankLinkLoading}
                />
              </div>

              {/* Account Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Account Number
                </label>
                <Input
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  className="bg-white/5 border-orbit-border text-foreground h-9 text-xs"
                  disabled={bankLinkLoading}
                />
              </div>

              {/* Confirm Account Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Confirm Account Number
                  {confirmAccountNumber && accountNumber !== confirmAccountNumber && (
                    <span className="text-red-400 text-[9px]">— Numbers don't match</span>
                  )}
                </label>
                <Input
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  placeholder="Re-enter account number"
                  className={`bg-white/5 border-orbit-border text-foreground h-9 text-xs ${confirmAccountNumber && accountNumber !== confirmAccountNumber ? "border-red-500/50" : ""}`}
                  disabled={bankLinkLoading}
                />
              </div>

              {/* IFSC Code */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" /> IFSC Code
                  {ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase()) && (
                    <span className="text-red-400 text-[9px]">— Invalid format</span>
                  )}
                </label>
                <Input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="bg-white/5 border-orbit-border text-foreground h-9 text-xs font-mono tracking-wider"
                  disabled={bankLinkLoading}
                />
              </div>

              {/* PAN Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" /> PAN Number
                  {pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase()) && (
                    <span className="text-red-400 text-[9px]">— Invalid (e.g. ABCDE1234F)</span>
                  )}
                </label>
                <Input
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="bg-white/5 border-orbit-border text-foreground h-9 text-xs font-mono tracking-wider"
                  disabled={bankLinkLoading}
                />
              </div>

              {/* API Error Banner */}
              {bankLinkError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-400">{bankLinkError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBankForm(false);
                    resetBankForm();
                  }}
                  disabled={bankLinkLoading}
                  className="flex-1 border-orbit-border text-muted-foreground h-8 text-[11px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLinkBank}
                  disabled={!bankFormValid || bankLinkLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 h-8 text-[11px] disabled:opacity-50"
                >
                  {bankLinkLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <><Check className="w-3 h-3 mr-1" /> Verify & Link</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ─── Wallet & Withdrawal ─── */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl p-3 sm:p-4 border border-orbit-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orbit-purple/10 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-orbit-purple" />
            </div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Wallet & Withdrawal
            </h3>
          </div>

          <div className="space-y-3">
            {/* Balance Row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Available Balance</p>
                <p className="text-xl font-black text-foreground">{formatCurrency(wallet.balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Pending Clearance</p>
                <p className="text-sm font-bold text-amber-400">{formatCurrency(wallet.pendingClearance)}</p>
              </div>
            </div>

            <Separator className="bg-orbit-border/20" />

            {/* Withdraw Section */}
            {!showWithdrawInput ? (
              <Button
                onClick={() => {
                  if (!bankAccount) {
                    toast.error("Link a bank account first to withdraw");
                    return;
                  }
                  setShowWithdrawInput(true);
                }}
                disabled={wallet.balance < 500}
                className="w-full bg-gradient-to-r from-orbit-purple to-orbit-cyan text-white hover:opacity-90 h-9 text-xs"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" />
                Withdraw Funds
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Min ₹500"
                    className="bg-white/5 border-orbit-border text-foreground h-9 text-xs flex-1"
                  />
                  <Button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) < 500}
                    className="bg-gradient-to-r from-orbit-purple to-orbit-cyan text-white hover:opacity-90 h-9 text-xs px-4"
                  >
                    Withdraw
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/50">
                  Minimum withdrawal: ₹500 &middot; Funds will be sent to {bankAccount?.bankName || "your bank account"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowWithdrawInput(false);
                    setWithdrawAmount("");
                  }}
                  className="text-muted-foreground/50 text-[10px] h-6 px-2"
                >
                  Cancel
                </Button>
              </div>
            )}

            {!bankAccount && (
              <p className="text-[10px] text-red-400/80 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Link a bank account to enable withdrawals
              </p>
            )}

            <Separator className="bg-orbit-border/20" />

            {/* Withdrawal History Summary */}
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                Withdrawal History
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/50">Total Withdrawn</span>
                <span className="text-xs font-bold text-green-400">{formatCurrency(wallet.totalWithdrawn)}</span>
              </div>
              {wallet.lastWithdrawnAt && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground/50">Last Withdrawal</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {new Date(wallet.lastWithdrawnAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {wallet.totalWithdrawn === 0 && (
                <p className="text-[10px] text-muted-foreground/40 mt-1">No withdrawals yet</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Account & Security ─── */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl p-3 sm:p-4 border border-orbit-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Account & Security
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Verification Status</p>
                <p className="text-[10px] text-muted-foreground/60">
                  {user.isVerified ? "Your identity is verified" : "Verification pending or not started"}
                </p>
              </div>
              {user.isVerified ? (
                <Badge variant="outline" className="border-green-500/30 text-green-400 text-[8px] px-1.5 py-0">
                  <Check className="w-2.5 h-2.5 mr-0.5" /> Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-400/30 text-amber-400 text-[8px] px-1.5 py-0">
                  <Clock className="w-2.5 h-2.5 mr-0.5" /> Unverified
                </Badge>
              )}
            </div>

            <Separator className="bg-orbit-border/20" />

            <Button
              variant="outline"
              size="sm"
              className="w-full border-orbit-border/50 text-muted-foreground hover:text-foreground hover:border-orbit-purple/30 h-8 text-[11px]"
              onClick={() => toast.info("Support chat coming soon!")}
            >
              <Info className="w-3.5 h-3.5 mr-1.5" />
              Contact Support
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── About ─── */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl p-3 sm:p-4 border border-orbit-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              About
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/70">App Version</span>
              <span className="text-xs font-mono text-muted-foreground">1.0.0</span>
            </div>

            <Separator className="bg-orbit-border/20" />

            <button
              className="w-full flex items-center justify-between group"
              onClick={() => toast.info("Terms of Service page coming soon")}
            >
              <span className="text-xs text-foreground group-hover:text-orbit-cyan transition-colors">
                Terms of Service
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-orbit-cyan transition-colors" />
            </button>

            <Separator className="bg-orbit-border/20" />

            <button
              className="w-full flex items-center justify-between group"
              onClick={() => toast.info("Privacy Policy page coming soon")}
            >
              <span className="text-xs text-foreground group-hover:text-orbit-cyan transition-colors">
                Privacy Policy
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-orbit-cyan transition-colors" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}