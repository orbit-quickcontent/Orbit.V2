import React, { useState } from 'react';

export interface UploadFinalReelProps {
  bookingId: string;
  onComplete: () => void;
}

export const UploadFinalReel: React.FC<UploadFinalReelProps> = ({ bookingId, onComplete }) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSimulateUpload = () => {
    setUploading(true);
    setFileName(`orbit_reel_final_${bookingId}.mp4`);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          onComplete();
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center justify-between">
        Upload Final Delivered Reel
        <span className="text-xs font-mono text-indigo-400">Job #{bookingId}</span>
      </h3>

      <div
        onClick={handleSimulateUpload}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
        }`}
      >
        <svg className="w-10 h-10 text-indigo-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-semibold text-white">Click or drag edited .MP4 reel file here</p>
        <p className="text-xs text-slate-500 mt-1">Supports H.264 / HEVC up to 500MB</p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="truncate max-w-[200px]">{fileName}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
