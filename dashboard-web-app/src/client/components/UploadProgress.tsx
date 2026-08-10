import React from 'react';

export interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  onCancel?: () => void;
}

const UploadProgressComponent: React.FC<UploadProgressProps> = ({
  fileName,
  progress,
  status,
  onCancel,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 truncate max-w-[70%]">
          <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-white truncate">{fileName}</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
          {status}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400 w-9 text-right">{progress}%</span>
        {onCancel && status === 'UPLOADING' && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export const UploadProgress = React.memo(UploadProgressComponent);
