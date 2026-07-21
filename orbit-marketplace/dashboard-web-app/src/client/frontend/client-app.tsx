"use client";

/**
 * 🔵 CLIENT FRONTEND | ClientApp
 * 
 * Main client orchestrator component. Uses React.lazy for
 * code-splitting heavy sub-views. Only DashboardHome loads
 * eagerly since it's the default view.
 * 
 * Used by: page.tsx
 * Category: Client UI
 */

import { useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { ClientNavbar } from "./client-navbar";
import { DashboardHome } from "./dashboard-home";
import { BottomNav } from "./bottom-nav";

// Lazy-load heavy views — they only load when user navigates to them
const PackageDashboard = lazy(() =>
  import("./package-dashboard").then((m) => ({ default: m.PackageDashboard }))
);
const BookingFlow = lazy(() =>
  import("./booking-flow").then((m) => ({ default: m.BookingFlow }))
);
const TrackingDashboard = lazy(() =>
  import("./tracking-dashboard").then((m) => ({ default: m.TrackingDashboard }))
);
const ProfileView = lazy(() =>
  import("./profile-view").then((m) => ({ default: m.ProfileView }))
);

// Minimal loading fallback — avoids layout shift
function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-orbit-cyan/30 border-t-orbit-cyan animate-spin" />
    </div>
  );
}

export default function ClientApp() {
  const { currentView, fetchPackages, fetchClientBookings } = useAppStore();

  useEffect(() => { 
    fetchPackages(); 
    fetchClientBookings();

    // Poll every 10 seconds to keep booking status in sync with the server.
    // This is a fallback for when WebSocket events are missed or the page loads fresh.
    const syncInterval = setInterval(() => {
      fetchClientBookings();
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [fetchPackages, fetchClientBookings]);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <ClientNavbar />
      <main className="flex-1 pb-20 px-3 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {currentView === "landing" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <DashboardHome />
              </motion.div>
            )}
            {currentView === "packages" && (
              <motion.div
                key="packages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={<ViewLoader />}>
                  <PackageDashboard />
                </Suspense>
              </motion.div>
            )}
            {currentView === "booking" && (
              <motion.div
                key="booking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={<ViewLoader />}>
                  <BookingFlow />
                </Suspense>
              </motion.div>
            )}
            {currentView === "tracking" && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={<ViewLoader />}>
                  <TrackingDashboard />
                </Suspense>
              </motion.div>
            )}
            {currentView === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={<ViewLoader />}>
                  <ProfileView />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}