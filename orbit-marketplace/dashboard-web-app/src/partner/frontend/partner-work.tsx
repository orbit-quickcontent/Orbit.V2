"use client";

/**
 * 🟣 PARTNER FRONTEND | PartnerWork
 *
 * Work section showing completed work history with amounts.
 * Compact mobile-first layout to reduce scrolling.
 * Uses ONLY real data from bookings in the store.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Briefcase,
  Inbox,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function PartnerWork() {
  const { bookings } = useAppStore();
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const completedBookings = bookings.filter((b) => b.status === "DELIVERED");

  // Calculate total earned from completed bookings only
  const totalEarned = completedBookings.length * 700;

  // Calculate monthly earnings from completed bookings this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyEarnings = completedBookings
    .filter((b) => {
      const d = new Date(b.bookingDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length * 700;

  const getCategoryBadge = (packageName: string) => {
    if (packageName.toLowerCase().includes("ugc") || packageName.toLowerCase().includes("professional")) {
      return "border-orbit-cyan/30 text-orbit-cyan bg-orbit-cyan/10";
    }
    return "border-orbit-purple/30 text-orbit-purple bg-orbit-purple/10";
  };

  const getCategoryLabel = (packageName: string) => {
    if (packageName.toLowerCase().includes("ugc") || packageName.toLowerCase().includes("professional")) {
      return "UGC";
    }
    return "Personalized";
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {/* Section Header */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Work History</h3>
              <p className="text-[10px] text-muted-foreground/60">Completed jobs</p>
            </div>
          </div>
          <Badge className="bg-green-500/15 text-green-400 border-0 text-[10px] font-bold px-2 py-0.5">
            {completedBookings.length} done
          </Badge>
        </div>
      </motion.div>

      {/* Summary Card - Compact */}
      <motion.div variants={staggerItem}>
        <div className="orbit-card rounded-xl border border-green-500/15 overflow-hidden">
          <div className="p-3 sm:p-4">
            {/* Total from completed work */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {completedBookings.length} Completed
                  </div>
                  <div className="text-[9px] text-muted-foreground/60">Lifetime work</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-green-400">
                  {formatCurrency(totalEarned)}
                </div>
                <div className="text-[8px] text-muted-foreground/50">Total earned</div>
              </div>
            </div>

            {/* Monthly gain highlight */}
            <div className="rounded-lg bg-gradient-to-r from-orbit-purple/[0.08] to-orbit-cyan/[0.08] border border-orbit-purple/10 p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-orbit-purple" />
                <span className="text-[10px] sm:text-xs font-medium text-foreground">This Month</span>
              </div>
              <span className="text-sm sm:text-base font-black text-gradient-orbit">
                {formatCurrency(monthlyEarnings)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Completed Work List */}
      <motion.div variants={staggerItem}>
        {completedBookings.length === 0 ? (
          <div className="orbit-card rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-orbit-purple/10 flex items-center justify-center mx-auto mb-2">
              <Inbox className="w-5 h-5 text-orbit-purple/50" />
            </div>
            <h4 className="text-xs font-semibold text-foreground mb-1">No Completed Work Yet</h4>
            <p className="text-[10px] text-muted-foreground/60">Completed bookings will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {(historyExpanded ? completedBookings : completedBookings.slice(0, 5)).map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="orbit-card rounded-lg p-2.5 flex items-center gap-2.5 border border-orbit-border/30 hover:border-green-500/20 transition-colors"
              >
                {/* Status icon */}
                <div className="w-7 h-7 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate">
                      {entry.packageName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[7px] px-1 py-0 shrink-0 ${getCategoryBadge(entry.packageName)}`}
                    >
                      {getCategoryLabel(entry.packageName)}
                    </Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground/60 flex items-center gap-1.5 mt-0.5">
                    <span>
                      {new Date(entry.bookingDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="truncate">{entry.location}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-green-400">
                    {formatCurrency(700)}
                  </div>
                  <div className="text-[7px] text-muted-foreground/40 uppercase">Paid</div>
                </div>
              </motion.div>
            ))}

            {/* Expand / Collapse button */}
            {completedBookings.length > 5 && (
              <button
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="w-full py-2 rounded-lg orbit-card border border-orbit-border/30 hover:border-orbit-cyan/20 transition-colors flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
              >
                {historyExpanded ? (
                  <>
                    Show Less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    View All ({completedBookings.length}) <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}