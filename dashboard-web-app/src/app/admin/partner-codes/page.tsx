"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface PartnerCodeItem {
  id: string;
  partnerEmail: string;
  code: string;
  trainerName: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  createdAt: string;
  appointmentDate: string;
}

export default function AdminPartnerCodesPage() {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [trainerName, setTrainerName] = useState('Senior Trainer Admin');
  const [customCode, setCustomCode] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('2026-08-10');
  const [notification, setNotification] = useState<string | null>(null);

  const [codesList, setCodesList] = useState<PartnerCodeItem[]>([
    {
      id: 'pc-001',
      partnerEmail: 'orbit.quickcontent@gmail.com',
      code: '123456',
      trainerName: 'System Admin (Master)',
      status: 'ACTIVE',
      createdAt: '2026-08-01',
      appointmentDate: 'Master Bypass Active'
    },
    {
      id: 'pc-002',
      partnerEmail: 'partner@test.com',
      code: 'ORBIT2024',
      trainerName: 'Mumbai Hub Trainer',
      status: 'USED',
      createdAt: '2026-08-02',
      appointmentDate: '2026-08-02 10:00 AM'
    }
  ]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ORBIT-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomCode(code);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail) {
      setNotification('Please enter a partner email');
      return;
    }

    const newCodeItem: PartnerCodeItem = {
      id: `pc-${Date.now()}`,
      partnerEmail,
      code: customCode || `ORBIT-${Math.floor(100000 + Math.random() * 900000)}`,
      trainerName,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      appointmentDate
    };

    setCodesList([newCodeItem, ...codesList]);
    setNotification(`✅ Partner Code '${newCodeItem.code}' generated and assigned to ${partnerEmail}`);
    setPartnerEmail('');
    setCustomCode('');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-cyan-500/20 text-cyan-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Admin Console
              </span>
              <span className="text-gray-400 text-sm">Partner Network</span>
            </div>
            <h1 className="text-3xl font-extrabold mt-2 text-white">Partner Verification Codes</h1>
            <p className="text-gray-400 text-sm mt-1">
              Issue & manage 6-digit offline training verification codes for new partners.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Master Bypass Notice Card */}
        <div className="bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-2xl">
              🔑
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300">Master Owner / Admin Bypass Code</h2>
              <p className="text-sm text-gray-300 mt-1">
                Use your dedicated owner credentials to log into the Partner app or web portal without offline training restrictions:
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono bg-black/40 p-3 rounded-xl border border-cyan-500/20">
                <div><span className="text-gray-400">Master Email:</span> <span className="text-cyan-400 font-bold">orbit.quickcontent@gmail.com</span></div>
                <div><span className="text-gray-400">Verification Code:</span> <span className="text-purple-400 font-bold">123456</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-900/80 border border-emerald-500/50 text-emerald-200 p-4 rounded-xl text-sm flex justify-between items-center">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-400 font-bold hover:text-white">✕</button>
          </div>
        )}

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Issue Code Form */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-5 h-fit shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>➕</span> Issue New Partner Code
            </h2>
            
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Partner Email *
                </label>
                <input
                  type="email"
                  required
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="newpartner@gmail.com"
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Trainer Name
                </label>
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Verification Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="Auto-generated if empty"
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-xl text-xs font-bold text-cyan-400 whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Appointment Session Date
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition duration-180"
              >
                Issue Verification Code
              </button>
            </form>
          </div>

          {/* Active Codes List */}
          <div className="lg:col-span-2 bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📋</span> Issued Partner Codes ({codesList.length})
              </h2>
              <span className="text-xs text-gray-400">Real-time sync</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Partner Email</th>
                    <th className="pb-3">Verification Code</th>
                    <th className="pb-3">Trainer</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Issued Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {codesList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/40 transition">
                      <td className="py-3.5 font-medium text-gray-200">{item.partnerEmail}</td>
                      <td className="py-3.5">
                        <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-400 text-xs">{item.trainerName}</td>
                      <td className="py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-400 text-xs">{item.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
