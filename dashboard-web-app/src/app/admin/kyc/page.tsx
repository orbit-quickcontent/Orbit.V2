"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Check, X, FileText, UserCheck } from "lucide-react";

export default function KycDashboardPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "/api";
      const token = localStorage.getItem("orbit_token") || "";
      const res = await fetch(`${API}/partners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleToggleVerification = async (partnerId: string, isVerified: boolean) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "/api";
      const token = localStorage.getItem("orbit_token") || "";
      await fetch(`${API}/admin/verify-partner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partnerId, isVerified }),
      });
      fetchPartners();
    } catch {
      alert("Failed to update verification status");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black flex items-center space-x-2 text-cyan-400">
            <ShieldCheck size={24} />
            <span>KYC & PARTNER VERIFICATION</span>
          </h1>
          <p className="text-xs text-gray-400">Review partner identity documents, background checks, and onboard approvals</p>
        </div>
      </div>

      <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Partner KYC Submissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Partner ID</th>
                <th className="p-3">Location</th>
                <th className="p-3">Rating</th>
                <th className="p-3">KYC Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-gray-900/50">
                  <td className="p-3 font-mono">#{p.id.substring(0, 8)}</td>
                  <td className="p-3">{p.location || "Location Pending"}</td>
                  <td className="p-3 text-amber-400 font-bold">{p.rating || 5.0} ★</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isVerified
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {p.isVerified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                  </td>
                  <td className="p-3 flex space-x-2">
                    {!p.isVerified ? (
                      <button
                        onClick={() => handleToggleVerification(p.id, true)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center space-x-1"
                      >
                        <Check size={14} />
                        <span>Approve KYC</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleVerification(p.id, false)}
                        className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-bold flex items-center space-x-1"
                      >
                        <X size={14} />
                        <span>Revoke KYC</span>
                      </button>
                    )}
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
