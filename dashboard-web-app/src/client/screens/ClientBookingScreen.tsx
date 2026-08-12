import React, { useState, useCallback, useMemo } from 'react';
import { BookingCard } from '../components/BookingCard';
import { CountdownTimer } from '../components/CountdownTimer';
import { useAppStore } from '@/lib/store';
import { FloatingBottomNav } from '@/components/ui/floating-bottom-nav';

export interface ClientBookingScreenProps {
  initialStatus?: string;
}

export const ClientBookingScreen: React.FC<ClientBookingScreenProps> = ({
  initialStatus = 'PENDING_PARTNER_ACCEPTANCE',
}) => {
  const { user } = useAppStore();
  const clientDisplayName = user.name || 'Client Creator';
  const clientLocation = user.location || (user as any).address || 'Studio 4B, 100 Innovation Way';
  const [navTab, setNavTab] = useState<'home' | 'packages' | 'tracking' | 'profile'>('home');
  const [status, setStatus] = useState<string>(initialStatus);
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; phone: string; rating: number } | null>(null);

  const handleAccept = useCallback(() => {
    setStatus('PARTNER_ACCEPTED');
    setPartnerInfo({
      name: 'Marcus Vance',
      phone: '+1 (555) 382-9102',
      rating: 4.9,
    });
  }, []);

  const handleSimulateStatus = useCallback((nextStatus: string) => {
    setStatus(nextStatus);
  }, []);

  const statusSteps = useMemo(
    () => [
      { key: 'PENDING_PARTNER_ACCEPTANCE', label: 'Matching Partner' },
      { key: 'PARTNER_ACCEPTED', label: 'Partner En Route' },
      { key: 'SHOOTING', label: 'Shoot in Progress' },
      { key: 'EDITING', label: 'Reel Processing' },
      { key: 'DELIVERED', label: 'Final Reel Delivered' },
    ],
    []
  );

  const currentStepIndex = useMemo(
    () => statusSteps.findIndex((s) => s.key === status),
    [statusSteps, status]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Client Booking Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time video shoot dispatch and live status tracker
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Live Connection Active
            </span>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <h2 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-6">
            Workflow Progress
          </h2>
          <div className="grid grid-cols-5 gap-2 relative">
            {statusSteps.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center text-center group">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 scale-110 shadow-lg shadow-emerald-500/30'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-xs mt-3 font-medium transition-colors ${
                      isCurrent
                        ? 'text-emerald-400 font-bold'
                        : isDone
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Status & Action Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <BookingCard
              id="ORB-88329"
              clientName={`${clientDisplayName} — Reel Shoot`}
              status={status}
              location={clientLocation}
              payout={150.0}
            />

            {status === 'PENDING_PARTNER_ACCEPTANCE' && (
              <CountdownTimer
                initialSeconds={15}
                label="Partner Matching Timeout"
                onExpire={() => console.log('Matching timed out')}
              />
            )}

            {partnerInfo && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Assigned Videographer Partner
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white">{partnerInfo.name}</h4>
                    <p className="text-sm text-slate-400">{partnerInfo.phone}</p>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold px-3 py-1 rounded-lg">
                    ★ {partnerInfo.rating}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Simulation Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Simulate Status Actions
            </h3>

            <button
              onClick={handleAccept}
              disabled={status === 'PARTNER_ACCEPTED'}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-colors text-sm"
            >
              Partner Accept Shoot
            </button>

            <button
              onClick={() => handleSimulateStatus('SHOOTING')}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-sm"
            >
              Start Shooting
            </button>

            <button
              onClick={() => handleSimulateStatus('EDITING')}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors text-sm"
            >
              Send to Editor Queue
            </button>

            <button
              onClick={() => handleSimulateStatus('DELIVERED')}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors text-sm"
            >
              Deliver Final Reel
            </button>
          </div>
        </div>
      </div>

      {/* Floating Dark Pill Bottom Bar matching screenshot */}
      <FloatingBottomNav
        activeTab={navTab}
        onSelectTab={setNavTab}
        userInitials={clientDisplayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'GC'}
      />
    </div>
  );
};

export default React.memo(ClientBookingScreen);
