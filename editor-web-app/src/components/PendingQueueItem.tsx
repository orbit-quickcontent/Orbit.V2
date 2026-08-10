import React from 'react';

export interface PendingQueueItemProps {
  id: string;
  clientName: string;
  reelPreset: string;
  rawDuration: string;
  payout: number;
  deadline: string;
  onAccept: (id: string) => void;
  onPreview: (id: string) => void;
}

const PendingQueueItemComponent: React.FC<PendingQueueItemProps> = ({
  id,
  clientName,
  reelPreset,
  rawDuration,
  payout,
  deadline,
  onAccept,
  onPreview,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/40 transition-all duration-200 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
            Job #{id}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
            {reelPreset}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white">{clientName}</h3>
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
          <span>Raw Footage: <strong className="text-slate-200">{rawDuration}</strong></span>
          <span>Deadline: <strong className="text-amber-400">{deadline}</strong></span>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
        <div className="text-left md:text-right">
          <span className="text-xs text-slate-500 block">Edit Bounty</span>
          <span className="text-xl font-extrabold text-emerald-400">${payout.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(id)}
            className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            Preview Footage
          </button>
          <button
            onClick={() => onAccept(id)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md shadow-emerald-500/20 transition-all"
          >
            Accept Job
          </button>
        </div>
      </div>
    </div>
  );
};

export const PendingQueueItem = React.memo(PendingQueueItemComponent);
