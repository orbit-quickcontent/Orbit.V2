import React, { useState } from 'react';
import { BookingCard } from '../components/BookingCard';
import { EarningsCard } from '../components/EarningsCard';
import { CountdownTimer } from '../components/CountdownTimer';

export const PartnerRequestScreen: React.FC = () => {
  const [requests, setRequests] = useState([
    {
      id: 'ORB-90210',
      clientName: 'Sarah Connor',
      location: 'Downtown Art District, Bldg 7',
      payout: 185.50,
      status: 'PENDING_PARTNER_ACCEPTANCE',
    },
    {
      id: 'ORB-90211',
      clientName: 'Tech Summit 2026',
      location: 'Grand Convention Center, Hall B',
      payout: 320.00,
      status: 'PENDING_PARTNER_ACCEPTANCE',
    },
  ]);

  const [acceptedJob, setAcceptedJob] = useState<string | null>(null);

  const handleAccept = (id: string) => {
    setAcceptedJob(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Partner Dispatch & Request Feed
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Accept incoming shoot requests in real-time or view your daily performance
          </p>
        </div>

        <EarningsCard
          todayEarnings={245.00}
          weeklyEarnings={1420.50}
          completedJobs={12}
          rating={4.9}
        />

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Incoming Dispatch Requests
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono">
              {requests.length} Active
            </span>
          </h2>

          {acceptedJob && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold">
              ✓ Successfully accepted booking #{acceptedJob}! You are now assigned to this shoot.
            </div>
          )}

          {requests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500">
              No active incoming dispatch requests right now. Stay tuned!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map((item) => (
                <div key={item.id} className="space-y-3">
                  <BookingCard
                    id={item.id}
                    clientName={item.clientName}
                    status={item.status}
                    location={item.location}
                    payout={item.payout}
                    onAccept={() => handleAccept(item.id)}
                    onReject={() => handleReject(item.id)}
                  />
                  <CountdownTimer
                    initialSeconds={15}
                    onExpire={() => handleReject(item.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerRequestScreen;
