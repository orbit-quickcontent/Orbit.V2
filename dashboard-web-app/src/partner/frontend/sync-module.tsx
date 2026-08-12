"use client";

/**
 * 🟣 PARTNER FRONTEND | SyncModule
 * 
 * Cloud sync progress visualization showing upload percentage,
 * current file being synced, transfer speed, and upload queue
 * with per-file status indicators.
 * 
 * Used by: partner-dashboard.tsx
 * Category: Partner UI
 */

import { Cloud, CheckCircle2, Film, Loader2, Wifi } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SyncModuleProps {
  syncProgress: number;
  syncSpeed: number;
  currentFile: string;
  syncFiles: string[];
}

export function SyncModule({ syncProgress, syncSpeed, currentFile, syncFiles }: SyncModuleProps) {
  return (
    <div className="orbit-card rounded-2xl p-3 sm:p-6 md:p-8">
      <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2"><Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-orbit-cyan" />Orbit Sync Module</h3>
      <div className="orbit-card rounded-xl p-3 sm:p-5 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Uploading to Open Cloud Server</span>
          <span className="text-lg font-black text-orbit-cyan">{syncProgress}%</span>
        </div>
        <Progress value={syncProgress} className="h-3 bg-white/5 mb-4" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Film className="w-3 h-3 text-orbit-cyan" /><span className="truncate max-w-[150px] sm:max-w-none">{currentFile}</span></div>
          <div className="flex items-center gap-1"><Wifi className="w-3 h-3 text-orbit-cyan" /><span>{syncSpeed} MB/s</span></div>
        </div>
      </div>
      <div className="space-y-2 mb-4 sm:mb-6">
        <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3">Upload Queue</h4>
        {syncFiles.map((file, idx) => {
          const isDone = syncProgress > ((idx + 1) / syncFiles.length) * 100;
          const isActive = !isDone && syncProgress > (idx / syncFiles.length) * 100;
          return (
            <div key={file} className={`flex items-center gap-3 orbit-card rounded-lg p-3 text-xs ${isDone ? "border-orbit-cyan/20" : isActive ? "border-orbit-cyan/40 bg-orbit-cyan/5" : "border-orbit-border"}`}>
              {isDone ? <CheckCircle2 className="w-4 h-4 text-orbit-cyan shrink-0" /> : isActive ? <Loader2 className="w-4 h-4 text-orbit-cyan shrink-0 animate-spin" /> : <Film className="w-4 h-4 text-muted-foreground shrink-0" />}
              <span className={`truncate ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{file}</span>
              {isDone && <span className="ml-auto text-orbit-cyan/60 shrink-0">Done</span>}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
        <Loader2 className="w-3 h-3 animate-spin text-orbit-cyan" /><span>Syncing in progress...</span>
      </div>
    </div>
  );
}