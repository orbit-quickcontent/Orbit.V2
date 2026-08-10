import React from 'react';

export interface AcceptRejectButtonsProps {
  onAccept: () => void;
  onReject: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

export const AcceptRejectButtons: React.FC<AcceptRejectButtonsProps> = ({
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}) => {
  return (
    <div className="flex items-center gap-3 w-full">
      <button
        onClick={onAccept}
        disabled={isAccepting || isRejecting}
        className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-2"
      >
        {isAccepting ? (
          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>Accept Request</span>
        )}
      </button>

      <button
        onClick={onReject}
        disabled={isAccepting || isRejecting}
        className="flex-1 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 disabled:opacity-50 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
      >
        {isRejecting ? (
          <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>Reject</span>
        )}
      </button>
    </div>
  );
};
