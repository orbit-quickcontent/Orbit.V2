"use client";

/**
 * 🟣 PARTNER FRONTEND | ShootingPhase
 * 
 * Active shooting interface with Orbit Capture Module status,
 * shot checklist, per-shot file upload, and complete & sync action.
 * 
 * Used by: partner-dashboard.tsx
 * Category: Partner UI
 */

import { Camera, Upload, Play, CheckCircle2, CloudUpload, HardDrive, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { type BookingInfo } from "@/lib/types";
import { SHOT_LIST } from "./constants";

interface ShootingPhaseProps {
  booking: BookingInfo;
  completedShots: Set<string>;
  setCompletedShots: React.Dispatch<React.SetStateAction<Set<string>>>;
  shotUploads: Map<string, string>;
  handleFileUpload: (shotId: string) => void;
  onCompleteShooting: () => void;
}

export function ShootingPhase({
  booking,
  completedShots,
  setCompletedShots,
  shotUploads,
  handleFileUpload,
  onCompleteShooting,
}: ShootingPhaseProps) {
  return (
    <div className="orbit-card rounded-2xl p-3 sm:p-6 md:p-8 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2"><Camera className="w-4 h-4 sm:w-5 sm:h-5 text-orbit-cyan" />Active Shoot</h3>
        <Badge variant="outline" className="border-orbit-cyan/30 text-orbit-cyan bg-orbit-cyan/10 w-fit">{booking.id}</Badge>
      </div>

      <div className="orbit-card rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
        {[
          { label: "Location", value: booking.location ? booking.location.split(" @")[0] : "" },
          { label: "Package", value: booking.packageName },
          { label: "Time", value: booking.timeSlot },
          { label: "Notes", value: booking.notes || "None" },
        ].map((d) => (
          <div key={d.label}><span className="text-xs text-muted-foreground">{d.label}</span><div className="font-medium text-sm">{d.value}</div></div>
        ))}
      </div>

      {/* Orbit Capture Module */}
      <div className="orbit-card rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 border border-orbit-cyan/20">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-500 animate-ping opacity-30" />
          </div>
          <span className="text-sm font-bold text-red-400">REC</span>
          <span className="text-xs text-muted-foreground">Orbit Capture Module — 4K 60fps</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HardDrive className="w-3 h-3 text-orbit-cyan" /><span>Storage: 24.8 GB</span>
          <span className="text-orbit-border">|</span>
          <Wifi className="w-3 h-3 text-orbit-cyan" /><span>Cloud: Connected</span>
        </div>
      </div>

      {/* Integrated Shot Checklist & Uploads */}
      <div className="orbit-card rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 border border-orbit-cyan/20">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-orbit-cyan" />
            Shot Checklist & Footage Uploads
          </h4>
          <Badge variant="outline" className={`text-xs ${shotUploads.size === SHOT_LIST.length ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-orbit-purple/30 text-orbit-purple bg-orbit-purple/5"}`}>
            {shotUploads.size}/{SHOT_LIST.length} uploaded
          </Badge>
        </div>

        <div className="space-y-2.5">
          {SHOT_LIST.map((shot) => {
            const isCompleted = completedShots.has(shot.id);
            const uploadedFile = shotUploads.get(shot.id);

            return (
              <div
                key={shot.id}
                className={`flex items-center gap-3 orbit-card rounded-lg p-3 transition-all ${
                  uploadedFile
                    ? "border-green-500/30 bg-green-500/5"
                    : isCompleted
                    ? "border-orbit-cyan/30 bg-orbit-cyan/5"
                    : "border-orbit-border"
                }`}
              >
                {/* Checkbox to check off the shot manually */}
                <Checkbox
                  id={shot.id}
                  checked={isCompleted}
                  onCheckedChange={() => {
                    setCompletedShots((prev) => {
                      const next = new Set(prev);
                      if (next.has(shot.id)) {
                        next.delete(shot.id);
                      } else {
                        next.add(shot.id);
                      }
                      return next;
                    });
                  }}
                  className="border-orbit-cyan/50 data-[state=checked]:bg-orbit-cyan data-[state=checked]:text-black shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={shot.id}
                    className={`text-xs sm:text-sm font-medium cursor-pointer ${
                      isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {shot.name}
                  </label>
                  <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">{shot.description}</p>
                  {uploadedFile && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-green-400">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{uploadedFile}</span>
                    </div>
                  )}
                </div>

                {/* Upload Button or Completed Icon */}
                <div className="shrink-0">
                  {uploadedFile ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFileUpload(shot.id)}
                      className="border-orbit-purple/30 text-orbit-purple hover:bg-orbit-purple/10 hover:text-orbit-purple h-8 text-xs px-2.5"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {shotUploads.size > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Sync Progress</span>
              <span>{Math.round((shotUploads.size / SHOT_LIST.length) * 100)}%</span>
            </div>
            <Progress value={(shotUploads.size / SHOT_LIST.length) * 100} className="h-1.5 bg-white/5" />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => toast.success("Orbit Capture Module activated", { description: "Recording in 4K at 60fps" })} variant="outline" className="flex-1 border-orbit-cyan/30 text-orbit-cyan hover:bg-orbit-cyan/10 font-bold">
          <Play className="w-4 h-4 mr-2" />Start Shooting
        </Button>
        <Button onClick={onCompleteShooting} disabled={completedShots.size < SHOT_LIST.length} className="flex-1 bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold orbit-glow">
          <Upload className="w-4 h-4 mr-2" />Complete & Sync ({completedShots.size}/{SHOT_LIST.length})
        </Button>
      </div>
    </div>
  );
}