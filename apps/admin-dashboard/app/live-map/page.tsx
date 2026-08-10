'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface PartnerMarker {
  partnerId: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'ONLINE' | 'BUSY' | 'ON_TRIP' | 'OFFLINE';
  lastUpdated: string;
  speed?: number;
}

export default function LiveMapPage() {
  const [partners, setPartners] = useState<Record<string, PartnerMarker>>({
    p1: {
      partnerId: 'p1',
      name: 'Rahul Sharma (FX3)',
      latitude: 19.076,
      longitude: 72.8777,
      status: 'ONLINE',
      lastUpdated: new Date().toLocaleTimeString(),
      speed: 12,
    },
    p2: {
      partnerId: 'p2',
      name: 'Priya Verma (Komodo)',
      latitude: 19.082,
      longitude: 72.881,
      status: 'ONLINE',
      lastUpdated: new Date().toLocaleTimeString(),
      speed: 28,
    },
    p3: {
      partnerId: 'p3',
      name: 'Vikram Mehta (R5 C)',
      latitude: 19.065,
      longitude: 72.869,
      status: 'BUSY',
      lastUpdated: new Date().toLocaleTimeString(),
      speed: 0,
    },
    p4: {
      partnerId: 'p4',
      name: 'Ananya Roy (BMPCC)',
      latitude: 19.1197,
      longitude: 72.905,
      status: 'OFFLINE',
      lastUpdated: new Date().toLocaleTimeString(),
      speed: 0,
    },
  });

  const [connected, setConnected] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerMarker | null>(null);

  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('admin:joinMap');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Real-time location updates emitted by API backend
    socket.on('partner:locationUpdate', (data: any) => {
      setPartners((prev) => ({
        ...prev,
        [data.partnerId]: {
          partnerId: data.partnerId,
          name: prev[data.partnerId]?.name || `Partner ${data.partnerId.substring(0, 4)}`,
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status || 'ONLINE',
          lastUpdated: new Date().toLocaleTimeString(),
          speed: data.speed || 0,
        },
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const partnerList = Object.values(partners);
  const onlineCount = partnerList.filter((p) => p.status === 'ONLINE').length;
  const busyCount = partnerList.filter((p) => p.status === 'BUSY' || p.status === 'ON_TRIP').length;
  const offlineCount = partnerList.filter((p) => p.status === 'OFFLINE').length;

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100 overflow-hidden">
      {/* Sidebar Control Panel */}
      <div className="w-96 bg-[#1E293B] border-r border-slate-800 flex flex-col z-10 shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
              ORBIT Live Fleet
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Socket.IO Room: admin:map</p>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
        </div>

        {/* Fleet Metrics Summary */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-[#0F172A]/50 border-b border-slate-800">
          <div className="bg-[#1E293B] p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs font-semibold text-emerald-400 block">ONLINE</span>
            <span className="text-xl font-bold text-white">{onlineCount}</span>
          </div>
          <div className="bg-[#1E293B] p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs font-semibold text-amber-400 block">BUSY</span>
            <span className="text-xl font-bold text-white">{busyCount}</span>
          </div>
          <div className="bg-[#1E293B] p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs font-semibold text-slate-400 block">OFFLINE</span>
            <span className="text-xl font-bold text-white">{offlineCount}</span>
          </div>
        </div>

        {/* Live Partner Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Active Partners ({partnerList.length})
          </h2>
          {partnerList.map((partner) => {
            const isSelected = selectedPartner?.partnerId === partner.partnerId;
            return (
              <div
                key={partner.partnerId}
                onClick={() => setSelectedPartner(partner)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-[#0F172A]/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        partner.status === 'ONLINE'
                          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                          : partner.status === 'BUSY' || partner.status === 'ON_TRIP'
                          ? 'bg-amber-500 shadow-lg shadow-amber-500/50'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span className="font-semibold text-sm text-white">{partner.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      partner.status === 'ONLINE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : partner.status === 'BUSY'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {partner.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>
                    {partner.latitude.toFixed(4)}, {partner.longitude.toFixed(4)}
                  </span>
                  <span>{partner.speed ? `${partner.speed} km/h` : '0 km/h'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Live Map Canvas */}
      <div className="flex-1 relative bg-[#0B0F19]">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Visual Interactive Map Radar Simulator */}
          <div className="relative w-full h-full p-8 flex flex-col justify-between bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="flex items-center justify-between z-10">
              <div className="bg-[#1E293B]/90 backdrop-blur border border-slate-800 px-4 py-2 rounded-xl text-xs flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Online
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Busy
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Offline
                </span>
              </div>
              <div className="bg-[#1E293B]/90 backdrop-blur border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
                GPS Feed: Active • Lat: 19.0760 | Lng: 72.8777 (Mumbai Region)
              </div>
            </div>

            {/* Simulated Live Map Markers Visualizer */}
            <div className="relative flex-1 my-6 rounded-2xl border border-slate-800/80 bg-[#0F172A]/40 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
              {partnerList.map((p, idx) => {
                // Map coordinate to visual percentage for layout
                const topPct = 30 + (idx * 15) % 50;
                const leftPct = 25 + (idx * 20) % 55;

                return (
                  <div
                    key={p.partnerId}
                    style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                    onClick={() => setSelectedPartner(p)}
                  >
                    <div
                      className={`relative flex items-center justify-center p-2 rounded-full text-white shadow-xl transition-all duration-300 transform group-hover:scale-125 ${
                        p.status === 'ONLINE'
                          ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                          : p.status === 'BUSY'
                          ? 'bg-amber-500 ring-4 ring-amber-500/20'
                          : 'bg-slate-600 ring-4 ring-slate-600/20'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {p.status === 'ONLINE' && (
                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30"></span>
                      )}
                    </div>
                    <div className="mt-1 bg-[#1E293B] border border-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold text-white shadow-md whitespace-nowrap">
                      {p.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Selected Partner Details Drawer */}
            {selectedPartner && (
              <div className="bg-[#1E293B]/95 backdrop-blur border border-slate-700 p-4 rounded-xl flex items-center justify-between text-xs z-10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      selectedPartner.status === 'ONLINE'
                        ? 'bg-emerald-500'
                        : selectedPartner.status === 'BUSY'
                        ? 'bg-amber-500'
                        : 'bg-slate-500'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-sm text-white">{selectedPartner.name}</div>
                    <div className="text-slate-400">
                      Coordinates: {selectedPartner.latitude.toFixed(4)}, {selectedPartner.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-indigo-400 font-semibold">Speed: {selectedPartner.speed || 0} km/h</div>
                  <div className="text-slate-400">Last Ping: {selectedPartner.lastUpdated}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
