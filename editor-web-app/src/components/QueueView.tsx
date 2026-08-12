"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle, Video, Play } from "lucide-react";

export interface QueueItem {
  id: string;
  packageName: string;
  clientName: string;
  status: "READY_TO_EDIT" | "EDITING" | "DELIVERED";
  createdAt: string;
  targetDeliveryIso: string; // e.g. 2026-08-07T19:00:00Z
  footageCount?: number;
}

export function QueueView({
  items,
  onSelectBooking,
}: {
  items: QueueItem[];
  onSelectBooking: (id: string) => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getSlaStatus = (targetIso: string) => {
    const target = new Date(targetIso).getTime();
    const diffMins = Math.floor((target - now) / (1000 * 60));

    if (diffMins < 0) {
      return { label: `Overdue by ${Math.abs(diffMins)}m`, color: "bg-red-950 text-red-400 border-red-500 animate-pulse", mins: diffMins };
    }
    if (diffMins < 20) {
      return { label: `${diffMins}m remaining`, color: "bg-red-900/40 text-red-400 border-red-500/40", mins: diffMins };
    }
    if (diffMins <= 45) {
      return { label: `${diffMins}m remaining`, color: "bg-amber-900/40 text-amber-400 border-amber-500/40", mins: diffMins };
    }
    return { label: `${diffMins}m remaining`, color: "bg-emerald-950/40 text-emerald-400 border-emerald-500/40", mins: diffMins };
  };

  // Sort queue by SLA urgency (most urgent / overdue first)
  const sortedItems = [...items].sort((a, b) => {
    const targetA = new Date(a.targetDeliveryIso).getTime();
    const targetB = new Date(b.targetDeliveryIso).getTime();
    return targetA - targetB;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-gray-800">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Clock className="text-cyan-400" size={20} />
          <span>SLA Queue (Urgency Sorted)</span>
        </h3>
        <span className="text-xs text-gray-400">{sortedItems.length} active jobs</span>
      </div>

      {sortedItems.length === 0 ? (
        <div className="p-8 text-center bg-[#0D111D] border border-gray-800 rounded-2xl text-gray-400 text-sm">
          No active projects in queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedItems.map((item) => {
            const sla = getSlaStatus(item.targetDeliveryIso);
            return (
              <div
                key={item.id}
                onClick={() => onSelectBooking(item.id)}
                className="bg-[#0B0F19] border border-gray-800 hover:border-cyan-500/50 p-5 rounded-2xl cursor-pointer transition-all space-y-3 shadow-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-gray-400">
                      ID: #{item.id.substring(0, 8)}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">{item.packageName}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${sla.color}`}>
                    {sla.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                  <span>Client: <strong className="text-gray-200">{item.clientName}</strong></span>
                  <span className="flex items-center space-x-1 text-cyan-400 font-semibold">
                    <Play size={12} />
                    <span>Open Studio</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
