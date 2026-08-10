import React, { useState, useEffect } from 'react';

export interface CountdownTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
  label?: string;
}

const CountdownTimerComponent: React.FC<CountdownTimerProps> = ({
  initialSeconds = 15,
  onExpire,
  label = 'Partner Acceptance Window',
}) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpire]);

  const percentage = Math.max(0, (seconds / initialSeconds) * 100);
  const isUrgent = seconds <= 5;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span
          className={`text-sm font-mono font-bold ${
            isUrgent ? 'text-red-400 animate-pulse' : 'text-amber-400'
          }`}
        >
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:
          {String(seconds % 60).padStart(2, '0')}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-red-500' : 'bg-amber-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const CountdownTimer = React.memo(CountdownTimerComponent);
