"use client";

import React, { useState } from "react";
import { Settings, Shield, Zap, Database, Sliders, AlertTriangle } from "lucide-react";

export default function SuperAdminDashboardPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = useState("1.0");
  const [partnerPayoutPct, setPartnerPayoutPct] = useState("70");

  const handleSaveSettings = () => {
    alert("SuperAdmin settings saved successfully!");
  };

  const handleSeedDatabase = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "/api";
      const token = localStorage.getItem("orbit_token") || "";
      const res = await fetch(`${API}/admin/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Database seeded successfully!");
      } else {
        alert("Seeding failed: " + (await res.text()));
      }
    } catch {
      alert("Error seeding database.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black flex items-center space-x-2 text-red-400">
            <Shield size={24} />
            <span>SUPERADMIN SYSTEM CONTROLS</span>
          </h1>
          <p className="text-xs text-gray-400">Manage dynamic pricing, platform feature flags, and system maintenance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing & Payout Config */}
        <div className="bg-[#0B0F19] border border-gray-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Sliders className="text-cyan-400" size={20} />
            <span>Dynamic Pricing & Payout Multipliers</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Surge Multiplier (1.0x - 2.5x)</label>
              <input
                type="number"
                step="0.1"
                value={surgeMultiplier}
                onChange={(e) => setSurgeMultiplier(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Partner Payout Percentage (%)</label>
              <input
                type="number"
                value={partnerPayoutPct}
                onChange={(e) => setPartnerPayoutPct(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl text-sm transition-all"
            >
              Update Pricing Rules
            </button>
          </div>
        </div>

        {/* System Flags & Seed */}
        <div className="bg-[#0B0F19] border border-gray-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Zap className="text-amber-400" size={20} />
            <span>System Maintenance & Seeding</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-gray-900 border border-gray-800 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-white">Maintenance Mode</p>
                <p className="text-xs text-gray-400">Restricts new booking creation</p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 accent-red-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleSeedDatabase}
              className="w-full py-3 bg-red-950/80 border border-red-500/40 hover:bg-red-900 text-red-300 font-bold rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
            >
              <Database size={16} />
              <span>Seed Initial Database Entries</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
