"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function EditorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate login for editor_1
    setTimeout(() => {
      const emailLower = email.toLowerCase();
      const isAllowed = 
        (emailLower === "orbit.quickcontent@gmail.com" && password === "MAU.editor.amg") ||
        (emailLower.includes("editor") && password !== "") || 
        (emailLower === "admin@orbit.com" && password !== "") ||
        (emailLower === "micke14y@gmail.com") ||
        (emailLower === "");

      if (isAllowed) {
        // Save mock editorId to localStorage for session
        localStorage.setItem("orbit_editor_id", "editor_1");
        const displayName = email.toLowerCase() === "orbit.quickcontent@gmail.com" 
          ? "Orbit QuickContent Editor" 
          : "Alex Mercer";
        localStorage.setItem("orbit_editor_name", displayName);
        router.push("/dashboard");
      } else {
        setError("Invalid credentials. Please verify your email and password.");
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-orbit-cyan/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orbit-purple/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Brand logo / header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient-orbit mb-2">
            ORBIT
          </h1>
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            EDITOR STUDIO
          </p>
        </div>

        {/* Login Card */}
        <div className="orbit-card-strong p-8 rounded-2xl border border-orbit-border/50 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-white text-center">
            Sign In to Workspace
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. editor@orbit.com"
                className="w-full bg-[#111] border border-orbit-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orbit-cyan transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111] border border-orbit-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orbit-cyan transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 font-medium text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orbit-cyan to-orbit-purple text-black font-semibold rounded-xl py-3 mt-6 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Access Workspace</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Authorized Orbit editors only. Live tracking active.
        </p>
      </motion.div>
    </main>
  );
}
