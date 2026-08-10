import React from 'react';

export interface BookingCardProps {
  id: string;
  clientName: string;
  status: string;
  location: string;
  payout: number;
  onAccept?: () => void;
  onReject?: () => void;
  onSelect?: () => void;
}

const BookingCardComponent: React.FC<BookingCardProps> = ({
  id,
  clientName,
  status,
  location,
  payout,
  onAccept,
  onReject,
  onSelect,
}) => {
  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PENDING_PARTNER_ACCEPTANCE':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'PARTNER_ACCEPTED':
      case 'EN_ROUTE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'SHOOTING':
      case 'EDITING':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div
      onClick={onSelect}
      className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-200 shadow-xl backdrop-blur-md cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          Booking #{id.substring(0, 8)}
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(
            status
          )}`}
        >
          {status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1">{clientName}</h3>
        <p className="text-sm text-slate-400 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <div>
          <span className="text-xs text-slate-500 block">Estimated Payout</span>
          <span className="text-xl font-bold text-emerald-400">${payout.toFixed(2)}</span>
        </div>

        {(onAccept || onReject) && (
          <div className="flex items-center gap-2">
            {onReject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
                className="px-3.5 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
              >
                Reject
              </button>
            )}
            {onAccept && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="px-3.5 py-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
              >
                Accept
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const BookingCard = React.memo(BookingCardComponent);
