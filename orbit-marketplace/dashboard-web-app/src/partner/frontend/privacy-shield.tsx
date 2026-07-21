"use client";

/**
 * 🟣 PARTNER FRONTEND | PrivacyShield
 * 
 * Privacy verification completion screen. Displays sync verification
 * status, local wipe confirmation, cloud status, and encryption info.
 * Provides "View Payment" action to proceed.
 * 
 * Used by: partner-dashboard.tsx
 * Category: Partner UI
 */

import { motion } from "framer-motion";
import { Shield, CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrivacyShieldProps {
  syncFiles: string[];
  onViewPayment: () => void;
}

export function PrivacyShield({ syncFiles, onViewPayment }: PrivacyShieldProps) {
  return (
    <div className="orbit-card rounded-2xl p-4 sm:p-8 md:p-10 text-center orbit-glow">
      <motion.div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-green-500/10 flex items-center justify-center border-2 border-green-500/30" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.8 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
          <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="text-xl sm:text-2xl font-black mb-2 sm:mb-3"><span className="text-green-400">Privacy Shield</span> Activated</h3>
        <div className="flex items-center justify-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5 text-green-400" /><span className="text-sm font-medium text-green-400">100% Synced & Verified</span></div>
        <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">All local footage has been securely wiped from your device. The raw footage is now safely on the Open Cloud Server.</p>
        <div className="orbit-card rounded-xl p-4 mb-8 max-w-sm mx-auto border border-green-500/20">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "Files Synced", value: String(syncFiles.length) },
              { label: "Local Wipe", value: "Complete" },
              { label: "Cloud Status", value: "Verified" },
              { label: "Encryption", value: "AES-256" },
            ].map((d) => (
              <div key={d.label}>
                <span className="text-muted-foreground">{d.label}</span>
                <div className={`font-bold ${d.value === "Complete" || d.value === "Verified" ? "text-green-400" : "text-foreground"}`}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={onViewPayment} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 font-bold orbit-glow px-8">
          <CreditCard className="w-4 h-4 mr-2" />View Payment
        </Button>
      </motion.div>
    </div>
  );
}