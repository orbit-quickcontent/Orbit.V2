import React from 'react';

export interface EarningsCardProps {
  todayEarnings: number;
  weeklyEarnings: number;
  completedJobs: number;
  rating: number;
}

const EarningsCardComponent: React.FC<EarningsCardProps> = ({
  todayEarnings,
  weeklyEarnings,
  completedJobs,
  rating,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Earnings & Performance Summary</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/60">
          <span className="text-xs text-slate-500 block mb-1">Today's Earnings</span>
          <span className="text-2xl font-extrabold text-emerald-400">${todayEarnings.toFixed(2)}</span>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/60">
          <span className="text-xs text-slate-500 block mb-1">Weekly Total</span>
          <span className="text-2xl font-extrabold text-blue-400">${weeklyEarnings.toFixed(2)}</span>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/60">
          <span className="text-xs text-slate-500 block mb-1">Completed Shoots</span>
          <span className="text-xl font-bold text-white">{completedJobs}</span>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/60">
          <span className="text-xs text-slate-500 block mb-1">Rating</span>
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold text-amber-400">{rating.toFixed(1)}</span>
            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EarningsCard = React.memo(EarningsCardComponent);
