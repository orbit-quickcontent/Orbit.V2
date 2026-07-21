"use client";

/**
 * PartnerEarnings
 *
 * Earnings section showing real earnings from completed bookings.
 * Compact mobile-first layout to reduce scrolling.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  IndianRupee,
  CreditCard,
  Star,
  CircleCheckBig,
  Clock,
  Sparkles,
  Timer,
  ArrowUpRight,
  ArrowDownToLine,
  Building2,
  Settings,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";

const MIN_WITHDRAWAL = 500;

export function PartnerEarnings() {
  const { bookings, reviews, user, withdrawFromWallet, setCurrentView, fetchPartnerProfile, partnerId } = useAppStore();

  useEffect(() => {
    if (partnerId) {
      fetchPartnerProfile();
    }
  }, [partnerId, fetchPartnerProfile]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { wallet, bankAccount } = user;

  const completedBookings = bookings.filter((b) => b.status === "DELIVERED");
  const totalEarned = completedBookings.length * 700;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentWeek = getWeekNumber(now);

  const monthlyEarnings = completedBookings
    .filter((b) => {
      const d = new Date(b.bookingDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length * 700;

  const weeklyEarnings = completedBookings
    .filter((b) => {
      const d = new Date(b.bookingDate);
      return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
    }).length * 700;

  const avgPerProject = completedBookings.length > 0
    ? Math.round(totalEarned / completedBookings.length)
    : 0;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.partnerRating, 0) / reviews.length).toFixed(1)
    : "-";

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL)}`);
      return;
    }
    if (amount > wallet.balance) {
      toast.error("Insufficient wallet balance");
      return;
    }
    setIsWithdrawing(true);
    // Simulate a short delay for UX
    setTimeout(() => {
      withdrawFromWallet(amount);
      setWithdrawAmount("");
      setIsWithdrawing(false);
      toast.success(`${formatCurrency(amount)} withdrawn successfully!`, {
        description: `Transferred to ${bankAccount?.bankName ?? "bank account"}`,
      });
    }, 800);
  };

  const maskedAccount = bankAccount
    ? `${bankAccount.bankName} ****${bankAccount.accountNumber.slice(-4)}`
    : null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-3 sm:space-y-4"
    >
      {/* Wallet Balance Card */}
      <motion.div variants={staggerItem}>
        <div className="relative overflow-hidden rounded-xl border border-orbit-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.10] via-transparent to-orbit-cyan/[0.05]" />
          <div className="relative p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Wallet Balance</h3>
                  <p className="text-[9px] text-muted-foreground/70">Available to withdraw</p>
                </div>
              </div>
            </div>

            <div className="text-center mb-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-center gap-1">
                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                  {wallet.balance.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-amber-500/[0.08] border border-amber-500/10 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Pending</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-400 truncate">
                  {formatCurrency(wallet.pendingClearance)}
                </div>
              </div>
              <div className="rounded-lg bg-orbit-purple/[0.08] border border-orbit-purple/10 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowDownToLine className="w-3 h-3 text-orbit-purple" />
                  <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Withdrawn</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-orbit-purple truncate">
                  {formatCurrency(wallet.totalWithdrawn)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Withdraw Section */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl p-3 sm:p-4 border border-orbit-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orbit-cyan/10 flex items-center justify-center">
              <ArrowDownToLine className="w-3.5 h-3.5 text-orbit-cyan" />
            </div>
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Withdraw</h4>
          </div>

          {!bankAccount ? (
            <div className="text-center py-3">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/[0.04] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground/70 mb-0.5">Link Bank Account to Withdraw</p>
              <p className="text-[10px] text-muted-foreground/40 mb-3">Add your bank details to start withdrawing earnings</p>
              <Button
                onClick={() => setCurrentView("profile")}
                variant="outline"
                className="border-orbit-cyan/30 text-orbit-cyan hover:bg-orbit-cyan/10 text-xs h-8"
              >
                <Settings className="w-3 h-3 mr-1" /> Go to Settings
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Bank Info */}
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-orbit-border/20">
                <Building2 className="w-4 h-4 text-orbit-cyan/70 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{maskedAccount}</p>
                  <p className="text-[9px] text-muted-foreground/50">{bankAccount.accountHolderName}</p>
                </div>
                {bankAccount.isVerified && (
                  <Badge variant="outline" className="border-green-500/20 text-green-400 text-[8px] shrink-0">
                    <CircleCheckBig className="w-2.5 h-2.5 mr-0.5" /> Verified
                  </Badge>
                )}
              </div>

              {/* Withdraw Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`${MIN_WITHDRAWAL}`}
                    min={MIN_WITHDRAWAL}
                    max={wallet.balance}
                    className="w-full h-9 pl-8 pr-2 rounded-lg bg-white/[0.05] border border-orbit-border/30 text-foreground text-sm font-medium placeholder:text-muted-foreground/30 focus:outline-none focus:border-orbit-cyan/40 focus:ring-1 focus:ring-orbit-cyan/20 transition-colors"
                  />
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || wallet.balance < MIN_WITHDRAWAL}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 font-bold h-9 text-xs px-4"
                >
                  {isWithdrawing ? (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing
                    </span>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-3.5 h-3.5 mr-1" /> Withdraw
                    </>
                  )}
                </Button>
              </div>

              {wallet.balance < MIN_WITHDRAWAL && wallet.balance > 0 && (
                <div className="flex items-start gap-1.5 px-2">
                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-400/80">Minimum withdrawal is {formatCurrency(MIN_WITHDRAWAL)}. You need {formatCurrency(MIN_WITHDRAWAL - wallet.balance)} more.</p>
                </div>
              )}
              {wallet.balance === 0 && (
                <p className="text-[10px] text-muted-foreground/40 text-center">No balance available for withdrawal</p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Hero Earnings Card - Compact */}
      <motion.div variants={staggerItem}>
        <div className="relative overflow-hidden rounded-xl border border-orbit-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.08] via-transparent to-orbit-purple/[0.05]" />

          <div className="relative p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Earnings</h3>
                  <p className="text-[9px] text-muted-foreground/70">Income summary</p>
                </div>
              </div>
              {completedBookings.length > 0 && (
                <Badge variant="outline" className="border-green-500/20 text-green-400 text-[9px] gap-1">
                  <TrendingUp className="w-2.5 h-2.5" />
                  {completedBookings.length} done
                </Badge>
              )}
            </div>

            {/* Total Earned */}
            <div className="text-center mb-3 pb-3 border-b border-white/[0.06]">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">
                Total Earned
              </p>
              <div className="flex items-center justify-center gap-1">
                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                  {totalEarned.toLocaleString("en-IN")}
                </span>
              </div>
              {weeklyEarnings > 0 && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <ArrowUpRight className="w-2.5 h-2.5 text-green-400" />
                  <span className="text-[10px] text-green-400 font-medium">
                    +{formatCurrency(weeklyEarnings)} this week
                  </span>
                </div>
              )}
            </div>

            {/* Monthly + Weekly row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-orbit-purple/[0.08] border border-orbit-purple/10 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard className="w-3 h-3 text-orbit-purple" />
                  <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Month</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-orbit-purple truncate">
                  {formatCurrency(monthlyEarnings)}
                </div>
              </div>
              <div className="rounded-lg bg-orbit-cyan/[0.08] border border-orbit-cyan/10 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Timer className="w-3 h-3 text-orbit-cyan" />
                  <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Week</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-orbit-cyan truncate">
                  {formatCurrency(weeklyEarnings)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Compact */}
      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-2 gap-2">
          <div className="orbit-card rounded-xl p-3 border border-orbit-border/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center">
                <CircleCheckBig className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Done</span>
            </div>
            <div className="text-xl font-black text-green-400">
              {completedBookings.length}
            </div>
          </div>

          <div className="orbit-card rounded-xl p-3 border border-orbit-border/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-amber-400/10 flex items-center justify-center">
                <Star className="w-3 h-3 text-amber-400" />
              </div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Rating</span>
            </div>
            <div className="text-xl font-black text-amber-400">
              {avgRating}
            </div>
          </div>

          <div className="orbit-card rounded-xl p-3 border border-orbit-border/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-orbit-cyan/10 flex items-center justify-center">
                <Clock className="w-3 h-3 text-orbit-cyan" />
              </div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Week</span>
            </div>
            <div className="text-xl font-black text-orbit-cyan truncate">
              {formatCurrency(weeklyEarnings)}
            </div>
          </div>

          <div className="orbit-card rounded-xl p-3 border border-orbit-border/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-orbit-purple/10 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-orbit-purple" />
              </div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Avg</span>
            </div>
            <div className="text-xl font-black text-orbit-purple truncate">
              {formatCurrency(avgPerProject)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Earnings Breakdown - Compact */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl p-3 border border-orbit-border/30">
          <h4 className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider">Breakdown</h4>
          <div className="space-y-2">
            {[
              { label: "Lifetime", amount: totalEarned, color: "text-green-400" },
              { label: "This Month", amount: monthlyEarnings, color: "text-orbit-purple" },
              { label: "This Week", amount: weeklyEarnings, color: "text-orbit-cyan" },
              { label: "Avg/Project", amount: avgPerProject, color: "text-amber-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-muted-foreground/70">{row.label}</span>
                <span className={`text-xs sm:text-sm font-bold ${row.color}`}>{formatCurrency(row.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper: get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}