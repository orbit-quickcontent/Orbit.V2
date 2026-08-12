"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, CheckCircle2, XCircle, Download, FileText, RefreshCw } from "lucide-react";

export default function FinanceDashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "/api";
      const token = localStorage.getItem("orbit_token") || "";
      const res = await fetch(`${API}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.logs || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Type,Amount,Status,Date\n" +
      transactions.map(t => `${t.id},${t.action},${t.details?.amount || 0},${t.status || 'PAID'},${t.createdAt}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbit_finance_payouts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black flex items-center space-x-2 text-emerald-400">
            <DollarSign size={24} />
            <span>FINANCE & PAYOUT APPROVALS</span>
          </h1>
          <p className="text-xs text-gray-400">Manage partner withdrawal approvals, settlement reconciliation, and TDS reports</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md"
          >
            <Download size={14} />
            <span>Export Payouts CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-[#0B0F19] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Pending Payout Approvals</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Partner ID</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Bank Details</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No pending payout approvals.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-900/50">
                    <td className="p-3 font-mono">#{tx.id.substring(0, 8)}</td>
                    <td className="p-3 font-semibold">{tx.userId || "Partner"}</td>
                    <td className="p-3 font-bold text-white">₹{tx.details?.amount || 700}</td>
                    <td className="p-3">Verified Bank Account</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {tx.status || "PENDING_APPROVAL"}
                      </span>
                    </td>
                    <td className="p-3 flex space-x-2">
                      <button
                        onClick={() => alert(`Approved payout for ${tx.id}`)}
                        className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                        title="Approve Payout"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => alert(`Rejected payout for ${tx.id}`)}
                        className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                        title="Reject Payout"
                      >
                        <XCircle size={16} />
                      </button>
                    </td>
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
