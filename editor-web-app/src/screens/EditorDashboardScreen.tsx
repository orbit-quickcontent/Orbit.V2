import React, { useState, useCallback } from 'react';
import { PendingQueueItem } from '../components/PendingQueueItem';
import { VideoPreview } from '../components/VideoPreview';
import { UploadFinalReel } from '../components/UploadFinalReel';

export const EditorDashboardScreen: React.FC = () => {
  const [pendingJobs, setPendingJobs] = useState([
    {
      id: 'EDT-1001',
      clientName: 'Fashion Week Highlights 2026',
      reelPreset: 'Instagram Reel (9:16 Vertical)',
      rawDuration: '14 min 30 sec',
      payout: 95.0,
      deadline: '2 hours remaining',
    },
    {
      id: 'EDT-1002',
      clientName: 'Product Launch Teaser',
      reelPreset: 'TikTok High-Energy Cut',
      rawDuration: '8 min 45 sec',
      payout: 75.0,
      deadline: '4 hours remaining',
    },
  ]);

  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [previewingJob, setPreviewingJob] = useState<string | null>(null);
  const [completedJobs, setCompletedJobs] = useState<string[]>([]);

  const handleAcceptJob = useCallback((id: string) => {
    setActiveJob(id);
    setPendingJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const handlePreviewJob = useCallback((id: string) => {
    setPreviewingJob(id);
  }, []);

  const handleCompleteUpload = useCallback(() => {
    setActiveJob((currentActive) => {
      if (currentActive) {
        setCompletedJobs((prev) => [...prev, currentActive]);
      }
      return null;
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Editor Production Suite
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Review raw footage, accept reel editing jobs, and deliver final cuts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-right">
              <span className="text-xs text-slate-500 block">Pending Queue</span>
              <span className="text-lg font-bold text-indigo-400">{pendingJobs.length} Jobs</span>
            </div>
          </div>
        </div>

        {/* Active Editing Workspace */}
        {activeJob && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Active Editing Job In Progress
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono">
                Job #{activeJob}
              </span>
            </h2>
            <UploadFinalReel bookingId={activeJob} onComplete={handleCompleteUpload} />
          </div>
        )}

        {/* Success Banner */}
        {completedJobs.length > 0 && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold flex items-center justify-between">
            <span>✓ Final reel delivered successfully for Job #{completedJobs[completedJobs.length - 1]}! Client notified.</span>
            <span className="text-xs bg-emerald-500/20 px-2.5 py-1 rounded">DELIVERED</span>
          </div>
        )}

        {/* Pending Queue List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Pending Editing Queue</h2>

          {pendingJobs.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500">
              No pending editing jobs in queue right now.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingJobs.map((item) => (
                <PendingQueueItem
                  key={item.id}
                  {...item}
                  onAccept={handleAcceptJob}
                  onPreview={handlePreviewJob}
                />
              ))}
            </div>
          )}
        </div>

        {/* Video Preview Modal */}
        {previewingJob && (
          <VideoPreview
            title={`Job #${previewingJob}`}
            onClose={() => setPreviewingJob(null)}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(EditorDashboardScreen);
