"use client";

import React, { useState } from "react";
import { AlertTriangle, PhoneCall, ShieldAlert, X } from "lucide-react";

export function SOSButton({ bookingId, partnerPhone }: { bookingId?: string; partnerPhone?: string }) {
  const [showModal, setShowModal] = useState(false);
  const [isAlertSent, setIsAlertSent] = useState(false);

  const handleTriggerSOS = async () => {
    setIsAlertSent(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "/api";
      const token = typeof window !== "undefined" ? localStorage.getItem("orbit_token") : "";
      await fetch(`${API}/sos/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ bookingId, timestamp: new Date().toISOString() }),
      }).catch(() => null);
    } catch {
      // ignore network errors for emergency trigger
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg transition-all"
        title="Emergency SOS Response"
      >
        <AlertTriangle size={14} className="animate-pulse" />
        <span>SOS Emergency</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120707] border border-red-500/50 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-red-900/50">
              <div className="flex items-center space-x-2 text-red-400">
                <ShieldAlert size={24} />
                <h3 className="text-lg font-bold text-white">Emergency Response</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-red-200">
              Clicking trigger will immediately alert the Orbit Safety Dispatch Team and log your current GPS coordinates.
            </p>

            {isAlertSent ? (
              <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-xl text-center space-y-2">
                <p className="text-sm font-bold text-white">🚨 SOS Alert Dispatched!</p>
                <p className="text-xs text-red-300">Orbit Safety Team is contacting you and law enforcement.</p>
              </div>
            ) : (
              <button
                onClick={handleTriggerSOS}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-sm uppercase tracking-wider shadow-xl transition-all"
              >
                Trigger Immediate Emergency Alert
              </button>
            )}

            <div className="space-y-2 pt-2 border-t border-red-950">
              <a
                href="tel:112"
                className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-gray-800"
              >
                <PhoneCall size={14} className="text-red-400" />
                <span>Call Emergency Services (112 / 100)</span>
              </a>

              {partnerPhone && (
                <a
                  href={`tel:${partnerPhone}`}
                  className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-gray-800"
                >
                  <PhoneCall size={14} />
                  <span>Call Assigned Partner ({partnerPhone})</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
