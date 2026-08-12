"use client";

import React, { useState } from "react";
import { HelpCircle, Search, DollarSign, MessageSquare, ShieldAlert } from "lucide-react";

export default function SupportDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [refundBookingId, setRefundBookingId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [noteText, setNoteText] = useState("");

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundBookingId || !refundAmount) return;
    alert(`Refund of ₹${refundAmount} requested for Booking ${refundBookingId}`);
    setRefundBookingId("");
    setRefundAmount("");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <div className="flex justify-between items-center pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black flex items-center space-x-2 text-purple-400">
            <HelpCircle size={24} />
            <span>SUPPORT & CONCIERGE DASHBOARD</span>
          </h1>
          <p className="text-xs text-gray-400">Search users, inspect booking timelines, and issue customer refunds</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0B0F19] border border-gray-800 p-4 rounded-2xl flex items-center space-x-3">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by User Email, Phone, Booking ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Refund Form */}
        <div className="bg-[#0B0F19] border border-gray-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <DollarSign className="text-amber-400" size={20} />
            <span>Issue Customer Refund / Credit</span>
          </h3>

          <form onSubmit={handleIssueRefund} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Booking ID</label>
              <input
                type="text"
                placeholder="e.g. bkg_12345"
                value={refundBookingId}
                onChange={(e) => setRefundBookingId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Refund Amount (₹)</label>
              <input
                type="number"
                placeholder="1999"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg"
            >
              Issue Refund
            </button>
          </form>
        </div>

        {/* Add Internal Note */}
        <div className="bg-[#0B0F19] border border-gray-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <MessageSquare className="text-cyan-400" size={20} />
            <span>Add Internal Support Note</span>
          </h3>
          <textarea
            rows={4}
            placeholder="Type internal support notes or escalation comments..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => {
              if (noteText) alert("Support note saved successfully!");
              setNoteText("");
            }}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl text-sm transition-all"
          >
            Save Internal Note
          </button>
        </div>
      </div>
    </div>
  );
}
