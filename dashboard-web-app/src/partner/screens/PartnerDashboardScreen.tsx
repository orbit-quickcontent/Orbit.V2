import React, { useState } from 'react';
import { IncomingRequestItem } from '../components/IncomingRequestItem';
import { EarningsCard } from '../../client/components/EarningsCard';

export const PartnerDashboardScreen: React.FC = () => {
  const [requests, setRequests] = useState([
    {
      id: 'REQ-501',
      clientName: 'Luxury Auto Launch Shoot',
      location: 'Speedway Track A',
      distance: '2.4 km away',
      payout: 220.0,
    },
    {
      id: 'REQ-502',
      clientName: 'Culinary Masterclass UGC',
      location: 'Bistro 44, Main St',
      distance: '1.1 km away',
      payout: 135.0,
    },
  ]);

  const [activeJob, setActiveJob] = useState<string | null>(null);

  const handleAccept = (id: string) => {
    setActiveJob(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Partner Live Command Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage incoming dispatch requests, earnings, and GPS status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
              ● Online & Ready for Dispatch
            </span>
          </div>
        </div>

        <EarningsCard
          todayEarnings={310.0}
          weeklyEarnings={1850.0}
          completedJobs={15}
          rating={4.95}
        />

        {activeJob && (
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Active Shoot Assignment in Progress</h3>
              <p className="text-xs text-emerald-300/80">Job ID: #{activeJob} • En Route to Location</p>
            </div>
            <button
              onClick={() => setActiveJob(null)}
              className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors"
            >
              Complete Shoot
            </button>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Available Dispatch Offers</h2>

          {requests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
              No active dispatch offers available at this moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map((item) => (
                <IncomingRequestItem
                  key={item.id}
                  {...item}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboardScreen;
