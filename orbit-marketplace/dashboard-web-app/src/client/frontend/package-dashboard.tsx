"use client";

/**
 * 🔵 CLIENT FRONTEND | PackageDashboard
 * 
 * Package selection cards with pricing, feature lists, and popular badge.
 * Clicking a card directly selects the package and routes the user to the booking flow.
 * 
 * When coming from "Brand DNA", the UGC package is auto-selected and redirects to the booking flow immediately.
 * 
 * Used by: client-app.tsx
 * Category: Client UI
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock, Zap, Star, Rocket, Shield, Lock, CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/constants";
import { type PackageInfo } from "@/lib/types";

export function PackageDashboard() {
  const { packages, setSelectedPackage, setCurrentView, highlightedPackageId, setHighlightedPackageId } = useAppStore();

  // Consumes highlighed package ID from Brand DNA redirect and routes directly to Booking
  useEffect(() => {
    if (highlightedPackageId) {
      const targetPkg = packages.find((p) => p.id === highlightedPackageId);
      if (targetPkg) {
        setSelectedPackage(targetPkg);
        setCurrentView("booking");
      }
      setHighlightedPackageId(null);
    }
  }, [highlightedPackageId, packages, setSelectedPackage, setCurrentView, setHighlightedPackageId]);

  const handleSelectPackage = (pkg: PackageInfo) => {
    setSelectedPackage(pkg);
    setCurrentView("booking");
  };

  return (
    <section className="pt-2 sm:pt-4 pb-8 sm:pb-12 px-0 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div className="text-center mb-8 sm:mb-12" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Badge variant="outline" className="mb-4 border-orbit-cyan/30 text-orbit-cyan bg-orbit-cyan/5">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Choose Your Package
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-2 sm:mb-3">
            The Orbit <span className="text-gradient-orbit">Edge</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Select the package that fits your needs. Both include professional editing delivered in 60-120 minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
          {packages.map((pkg, idx) => {
            const isHighlighted = pkg.id === highlightedPackageId;
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="h-full"
              >
                <Card
                  className={`relative overflow-hidden orbit-card transition-all duration-300 hover:scale-[1.02] cursor-pointer group h-full flex flex-col ${
                    pkg.popular
                      ? "border-orbit-cyan/30 hover:border-orbit-cyan/60 orbit-glow"
                      : isHighlighted
                      ? "border-amber-400/50 hover:border-amber-400/70 shadow-[0_0_24px_rgba(245,158,11,0.15)]"
                      : "border-orbit-border hover:border-orbit-cyan/20"
                  }`}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {isHighlighted && !pkg.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                        BRAND DNA
                      </div>
                    </div>
                  )}

                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                        pkg.popular ? "bg-gradient-to-br from-orbit-cyan/20 to-orbit-purple/20 text-orbit-cyan" : "bg-white/5 text-muted-foreground"
                      }`}>
                        {pkg.popular ? <Rocket className="w-4 h-4 sm:w-5 sm:h-5" /> : <Star className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold">{pkg.name}</CardTitle>
                        <CardDescription className="text-xs">{pkg.focus}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-gradient-orbit">{formatCurrency(pkg.price)}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">/session</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-orbit-cyan" />
                        Delivery in {pkg.deliveryTime}
                      </div>
                    </div>
                    <Separator className="bg-orbit-border" />
                    <ul className="space-y-2 sm:space-y-2.5">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm">
                          <CheckCircle2 className="w-4 h-4 text-orbit-cyan shrink-0 mt-0.5" />
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-4 sm:p-6 mt-auto">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPackage(pkg);
                      }}
                      className={`w-full font-bold py-4 sm:py-5 text-sm sm:text-base transition-all ${
                        pkg.popular
                          ? "bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 orbit-glow"
                          : "bg-white/10 text-foreground hover:bg-white/15 border border-orbit-border"
                      }`}
                    >
                      Book Now
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          {[
            { icon: <Shield className="w-4 h-4 text-orbit-cyan" />, label: "Secure Payment" },
            { icon: <Lock className="w-4 h-4 text-orbit-cyan" />, label: "Privacy Protected" },
            { icon: <Clock className="w-4 h-4 text-orbit-cyan" />, label: "60-Min Guarantee" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2">{t.icon}{t.label}</div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}