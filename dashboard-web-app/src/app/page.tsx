/**
 * ⚪ APP ENTRY | Main Page
 *
 * Root page component that manages app phases:
 * - splash → Animated loading screen with Orbit logo
 * - auth → LoginPage (role selection + profile creation)
 * - app → ClientApp or PartnerApp based on role
 *
 * Project Structure (4 sections):
 * └── src/
 *     ├── client/
 *     │   ├── frontend/               # 🔵 CLIENT FRONTEND: Client UI components
 *     │   └── backend/                # 🔵 CLIENT BACKEND: Client API handlers
 *     │
 *     ├── partner/
 *     │   ├── frontend/               # 🟣 PARTNER FRONTEND: Partner UI components
 *     │   └── backend/                # 🟣 PARTNER BACKEND: Partner API handlers
 *     │
 *     ├── shared/
 *     │   ├── frontend/               # 🟡 SHARED FRONTEND: Login, splash, etc.
 *     │   └── backend/                # 🟡 SHARED BACKEND: Auth handlers
 *     │
 *     ├── app/                        # Next.js App Router (thin API route wrappers)
 *     ├── lib/                        # Core: types, store, db, utils
 *     ├── hooks/                      # Custom React hooks
 *     └── components/ui/              # shadcn/ui components
 */

"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { LoginPage } from "@/shared/frontend";
import ClientApp from "@/client/frontend/client-app";
import PartnerApp from "@/partner/frontend/partner-app";

export default function OrbitApp() {
  const { appPhase, isAuthenticated, userRole, logout, _hydrated, _hydrate } = useAppStore();

  // Hydrate state from localStorage after mount
  useEffect(() => {
    _hydrate();
  }, [_hydrate]);

  // Activate login page on URL query param (e.g. ?login=true) or role mismatch
  useEffect(() => {
    if (_hydrated && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      const loginParam = params.get("login");
      const logoutParam = params.get("logout");

      if (loginParam === "true" || logoutParam === "true" || (roleParam && isAuthenticated && userRole !== roleParam)) {
        logout();
      }
    }
  }, [_hydrated, isAuthenticated, userRole, logout]);

  // Before hydration, show a sleek loading spinner
  if (!_hydrated) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#000000]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <p className="text-xs text-zinc-500 tracking-widest uppercase">Orbit Loading...</p>
        </div>
      </div>
    );
  }

  const showApp = isAuthenticated && appPhase === "app";

  return (
    <AnimatePresence mode="wait">
      {showApp ? (
        <motion.div
          key={userRole === "PARTNER" ? "partner" : "client"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {userRole === "PARTNER" ? <PartnerApp /> : <ClientApp />}
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
