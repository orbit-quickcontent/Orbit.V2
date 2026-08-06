"use client";

import React from "react";
import { Star, ShieldCheck, CheckCircle2, Zap, Award, Clock, MapPin } from "lucide-react";

export interface PartnerTrustData {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  completedJobs: number;
  isKycVerified: boolean;
  isBackgroundChecked?: boolean;
  isTopRated?: boolean;
  isFastResponder?: boolean;
  isProCreator?: boolean;
  etaMinutes?: number;
  responseTime?: string;
  location?: string;
}

export function PartnerCard({ partner }: { partner: PartnerTrustData }) {
  const ratingFormatted = (partner.rating || 5.0).toFixed(1);
  const completedJobs = partner.completedJobs || 0;

  return (
    <div className="bg-[#0B0F19] border border-cyan-950/60 hover:border-cyan-500/40 p-5 rounded-2xl transition-all shadow-xl">
      <div className="flex items-center space-x-4 mb-4">
        {/* Avatar / Photo */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-cyan-500 to-purple-600 p-[2px]">
            <img
              src={partner.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.name}`}
              alt={partner.name}
              className="w-full h-full object-cover rounded-2xl bg-black"
            />
          </div>
          {partner.isKycVerified && (
            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black p-0.5 rounded-full" title="KYC Verified">
              <ShieldCheck size={14} />
            </div>
          )}
        </div>

        {/* Name & Basic Meta */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-white truncate flex items-center space-x-1.5">
            <span>{partner.name}</span>
          </h4>
          <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
            <span className="flex items-center text-amber-400 font-semibold">
              <Star size={13} className="fill-amber-400 mr-1" />
              {ratingFormatted}
            </span>
            <span>•</span>
            <span>{completedJobs} Jobs Completed</span>
          </div>
        </div>

        {partner.etaMinutes !== undefined && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Estimated Arrival</span>
            <p className="text-lg font-black text-white">{partner.etaMinutes} mins</p>
          </div>
        )}
      </div>

      {/* Verification Badges */}
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-800/80">
        {partner.isKycVerified && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck size={11} className="mr-1" /> KYC Verified
          </span>
        )}

        {partner.isBackgroundChecked !== false && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckCircle2 size={11} className="mr-1" /> Background Checked
          </span>
        )}

        {(partner.rating >= 4.8 || partner.isTopRated) && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award size={11} className="mr-1" /> Top Rated Creator
          </span>
        )}

        {partner.isFastResponder && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap size={11} className="mr-1" /> Fast Responder
          </span>
        )}

        {partner.responseTime && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-300">
            <Clock size={11} className="mr-1" /> Avg: {partner.responseTime}
          </span>
        )}
      </div>
    </div>
  );
}
