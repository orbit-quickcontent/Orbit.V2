import React from 'react';

export interface VideoPreviewProps {
  title: string;
  videoUrl?: string;
  onClose: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ title, videoUrl, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">{title} - Raw Footage Preview</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-sm font-semibold px-2 py-1 bg-slate-800 rounded-lg"
          >
            ✕ Close
          </button>
        </div>

        <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6 space-y-2">
              <svg className="w-12 h-12 text-slate-700 mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-400 font-medium">Raw Footage Player Stream Ready</p>
              <p className="text-xs text-slate-600">4K 60fps ProRes RAW Proxy Active</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>Resolution: 3840x2160 (9:16 Vertical Cut)</span>
          <span>Audio: Dual Channel 48kHz</span>
        </div>
      </div>
    </div>
  );
};
