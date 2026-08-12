"use client";

import React, { useState } from "react";
import { MessageCircle, HelpCircle, X, ExternalLink } from "lucide-react";

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = "919876543210";
  const defaultMsg = encodeURIComponent("Hello Orbit Support, I need assistance with my booking.");

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 w-72 bg-[#0D111D] border border-cyan-950 rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <HelpCircle size={16} className="text-cyan-400" />
              <span>Orbit Concierge Support</span>
            </h4>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-gray-300">
            Our team is available 24/7 to assist with bookings, videographer dispatch, and edits.
          </p>

          <a
            href={`https://wa.me/${whatsappNumber}?text=${defaultMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <MessageCircle size={16} />
            <span>Chat on WhatsApp</span>
            <ExternalLink size={12} />
          </a>

          <div className="text-[10px] text-gray-500 text-center">
            Support Hours: 24/7 • Avg Response: &lt; 3 mins
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-black font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        title="Need Help? Contact Orbit Support"
      >
        {isOpen ? <X size={20} className="text-white" /> : <HelpCircle size={24} className="text-white" />}
      </button>
    </div>
  );
}
