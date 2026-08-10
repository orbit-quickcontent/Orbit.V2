import React from 'react';
import { AcceptRejectButtons } from './AcceptRejectButtons';

export interface IncomingRequestItemProps {
  id: string;
  clientName: string;
  location: string;
  distance: string;
  payout: number;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export const IncomingRequestItem: React.FC<IncomingRequestItemProps> = ({
  id,
  clientName,
  location,
  distance,
  payout,
  onAccept,
  onReject,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400">Request #{id}</span>
        <span className="text-lg font-extrabold text-emerald-400">${payout.toFixed(2)}</span>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-1">{clientName}</h3>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {location} • <strong className="text-slate-300">{distance}</strong>
        </p>
      </div>

      <AcceptRejectButtons
        onAccept={() => onAccept(id)}
        onReject={() => onReject(id)}
      />
    </div>
  );
};
