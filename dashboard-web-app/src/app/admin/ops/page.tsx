"use client";

import React, { useEffect, useState } from "react";
import { Activity, MapPin, RefreshCw, AlertCircle, CheckCircle, UserCheck } from "lucide-react";

export default function OpsDashboardPage() {
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [onlinePartners, setOnlinePartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOpsData = async () => {
    setIsLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "/api";
      const token = localStorage.getItem("orbit_token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [bRes, pRes] = await Promise.all([
        fetch(`${API}/bookings`, { headers }),
        fetch(`${API}/partners`, { headers }),
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        setActiveBookings(bData.bookings || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setOnlinePartners(pData.partners || []);
      }
    } catch (err) {
      console.error("Ops fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black flex items-center space-x-2 text-cyan-400">
            <Activity size={24} />
            <span>OPERATIONS CENTER</span>
          </h1>
          <p className="text-xs text-gray-400">Live Dispatch & Marketplace Dispatch Control</p>
        </div>
        <button
          onClick={fetchOpsData}
          className="px-3 py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-xl text-xs font-semibold flex items-center space-x-2"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh Live</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0B0F19] border border-cyan-950 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 uppercase font-bold">Active Bookings</p>
          <p className="text-3xl font-black text-white mt-1">
            {activeBookings.filter((b) => b.status !== "DELIVERED" && b.status !== "CANCELLED").length}
          </p>
        </div>
        <div className="bg-[#0B0F19] border border-cyan-950 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 uppercase font-bold">Online Partners</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{onlinePartners.length}</p>
        </div>
        <div className="bg-[#0B0F19] border border-cyan-950 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 uppercase font-bold">Dispatched</p>
          <p className="text-3xl font-black text-amber-400 mt-1">
            {activeBookings.filter((b) => b.status === "PARTNER_DISPATCHED" || b.status === "ACCEPTED").length}
          </p>
        </div>
        <div className="bg-[#0B0F19] border border-cyan-950 p-5 rounded-2xl">
          <p className="text-xs text-gray-400 uppercase font-bold">Editing In Progress</p>
          <p className="text-3xl font-black text-purple-400 mt-1">
            {activeBookings.filter((b) => b.status === "EDITING" || b.status === "READY_TO_EDIT").length}
          </p>
        </div>
      </div>

      {/* Live Active Bookings Table */}
      <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Live Booking Pipeline</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Booking ID</th>
                <th className="p-3">Client</th>
                <th className="p-3">Package</th>
                <th className="p-3">Status</th>
                <th className="p-3">Location</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-900/50">
                  <td className="p-3 font-mono">#{b.id.substring(0, 8)}</td>
                  <td className="p-3 font-semibold text-white">{b.user?.name || "Client"}</td>
                  <td className="p-3">{b.package?.name || "Standard"}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3 truncate max-w-xs">{b.location || "N/A"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => alert(`Re-dispatch initiated for ${b.id}`)}
                      className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded text-[11px] font-semibold"
                    >
                      Re-dispatch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
