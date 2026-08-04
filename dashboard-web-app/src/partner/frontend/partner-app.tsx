"use client";

/**
 * 🟣 PARTNER FRONTEND | PartnerApp
 *
 * Main partner orchestrator component. Uses React.lazy for
 * code-splitting heavy sub-views. Only PartnerDashboard loads
 * eagerly since it's the default view.
 *
 * Used by: page.tsx
 * Category: Partner UI
 */

import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { PartnerNavbar } from "./partner-navbar";
import { PartnerDashboard } from "./partner-dashboard";
import { PartnerBottomNav } from "./partner-bottom-nav";

// Lazy-load heavy views
const PartnerWork = lazy(() =>
  import("./partner-work").then((m) => ({ default: m.PartnerWork }))
);
const PartnerEarnings = lazy(() =>
  import("./partner-earnings").then((m) => ({ default: m.PartnerEarnings }))
);
const PartnerProfileView = lazy(() =>
  import("./partner-profile-view").then((m) => ({ default: m.PartnerProfileView }))
);
const PartnerSettings = lazy(() =>
  import("./partner-settings").then((m) => ({ default: m.PartnerSettings }))
);

// Minimal loading fallback
function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-orbit-purple/30 border-t-orbit-purple animate-spin" />
    </div>
  );
}

export default function PartnerApp() {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case "partner-work":
        return (
          <motion.div
            key="work"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<ViewLoader />}>
              <PartnerWork />
            </Suspense>
          </motion.div>
        );
      case "partner-earnings":
        return (
          <motion.div
            key="earnings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<ViewLoader />}>
              <PartnerEarnings />
            </Suspense>
          </motion.div>
        );
      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<ViewLoader />}>
              <PartnerProfileView />
            </Suspense>
          </motion.div>
        );
      case "partner-settings":
        return (
          <motion.div
            key="partner-settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<ViewLoader />}>
              <PartnerSettings />
            </Suspense>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PartnerDashboard />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <PartnerNavbar />
      <main className="flex-1 pb-20 px-3 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </div>
      </main>
      <PartnerBottomNav />
    </div>
  );
}