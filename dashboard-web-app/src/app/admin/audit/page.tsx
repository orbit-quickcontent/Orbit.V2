"use client";

import React, { useEffect, useState } from "react";
import { FileText, Download, Filter, RefreshCw } from "lucide-react";

export default function AuditLogViewerPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "/api";
      const token = localStorage.getItem("orbit_token") || "";
      const res = await fetch(`${API}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = filterAction
    ? auditLogs.filter((log) => (log.action || "").toLowerCase().includes(filterAction.toLowerCase()))
    : auditLogs;

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,ID,ActorID,Action,Entity,EntityID,Timestamp\n" +
      filteredLogs
        .map((l) => `${l.id},${l.userId || "system"},${l.action},${l.entity || ""},${l.entityId || ""},${l.createdAt}`)
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbit_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black flex items-center space-x-2 text-gray-300">
            <FileText size={24} />
            <span>SYSTEM AUDIT LOGS</span>
          </h1>
          <p className="text-xs text-gray-400">Complete immutable record of all administrative and financial actions</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0B0F19] border border-gray-800 p-4 rounded-2xl flex items-center space-x-3">
        <Filter size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Filter by Action (e.g. WALLET_WITHDRAW, VERIFY_PARTNER)..."
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-gray-500"
        />
      </div>

      <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Log ID</th>
                <th className="p-3">Actor ID</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    No audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-900/50">
                    <td className="p-3 font-mono">#{l.id.substring(0, 8)}</td>
                    <td className="p-3 font-semibold text-white">{l.userId || "SYSTEM"}</td>
                    <td className="p-3 font-bold text-cyan-400">{l.action}</td>
                    <td className="p-3">{l.entity || "N/A"}</td>
                    <td className="p-3 text-gray-400">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
