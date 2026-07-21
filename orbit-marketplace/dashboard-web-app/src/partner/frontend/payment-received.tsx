"use client";

/**
 * 🟣 PARTNER FRONTEND | PaymentReceived
 *
 * Payment confirmation screen showing amount credited, booking details,
 * updated earnings summary (from real booking data), and complete & return action.
 *
 * Used by: partner-dashboard.tsx
 * Category: Partner UI
 */

import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Wallet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BookingInfo } from "@/lib/types";
import { formatCurrency } from "@/lib/constants";
import { useAppStore } from "@/lib/store";

interface PaymentReceivedProps {
  booking: BookingInfo;
  onCompleteAndReturn: () => void;
}

export function PaymentReceived({ booking, onCompleteAndReturn }: PaymentReceivedProps) {
  const { bookings } = useAppStore();

  // Calculate real earnings from delivered bookings
  const deliveredBookings = bookings.filter((b) => b.status === "DELIVERED");
  const totalEarned = deliveredBookings.length * 700;

  // Calculate monthly earnings from delivered bookings this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyEarnings = deliveredBookings
    .filter((b) => {
      const d = new Date(b.bookingDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length * 700;

  const totalCompleted = deliveredBookings.length;

  return (
    <div className="orbit-card rounded-2xl p-4 sm:p-8 md:p-10 text-center orbit-glow">
      <motion.div
        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-orbit-cyan/20 to-orbit-purple/20 flex items-center justify-center border-2 border-orbit-cyan/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
          <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-orbit-cyan" />
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="text-xl sm:text-2xl font-black mb-2 sm:mb-3">
          <span className="text-orbit-cyan">Payment</span> Received!
        </h3>
        <div className="flex items-center justify-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm font-medium text-green-400">Credited to your account</span>
        </div>
        <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
          Payment for this project has been processed and credited to your Orbit Partner wallet.
        </p>

        {/* Amount Credited Card */}
        <div className="orbit-card rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 max-w-sm mx-auto border border-orbit-cyan/20">
          <div className="text-center mb-4">
            <span className="text-xs text-muted-foreground">Amount Credited</span>
            <div className="text-2xl sm:text-3xl font-black text-gradient-orbit mt-1">
              {formatCurrency(700)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "Booking ID", value: booking.id },
              { label: "Package", value: booking.packageName },
              { label: "Payment Status", value: "Credited" },
              { label: "Method", value: "Orbit Wallet" },
            ].map((d) => (
              <div key={d.label}>
                <span className="text-muted-foreground">{d.label}</span>
                <div className={`font-bold ${d.value === "Credited" ? "text-green-400" : "text-foreground"}`}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Updated Earnings Summary */}
        <div className="orbit-card rounded-xl p-4 mb-8 max-w-sm mx-auto border border-orbit-border">
          <div className="text-xs text-muted-foreground mb-3">Updated Earnings</div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-green-400" />
                <span className="text-sm font-medium">Total Earned</span>
              </div>
              <span className="text-lg font-black text-green-400">
                {formatCurrency(totalEarned + 700)}
              </span>
            </div>
            <div className="h-px bg-orbit-border/30" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-orbit-purple" />
                <span className="text-sm font-medium">This Month</span>
              </div>
              <span className="text-lg font-black text-gradient-orbit">
                {formatCurrency(monthlyEarnings + 700)}
              </span>
            </div>
            <div className="h-px bg-orbit-border/30" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-orbit-cyan" />
                <span className="text-sm font-medium">Total Completed</span>
              </div>
              <span className="text-lg font-black text-foreground">{totalCompleted + 1}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onCompleteAndReturn}
          className="bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold orbit-glow px-8"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Complete & Return
        </Button>
      </motion.div>
    </div>
  );
}