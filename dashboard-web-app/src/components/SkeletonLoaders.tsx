"use client";

import React from "react";

export function CardSkeleton() {
  return (
    <div className="bg-[#0D111D] border border-gray-800/60 p-5 rounded-2xl animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-24 h-4 bg-gray-800 rounded-md" />
        <div className="w-16 h-4 bg-gray-800 rounded-full" />
      </div>
      <div className="w-3/4 h-6 bg-gray-800 rounded-md" />
      <div className="w-1/2 h-4 bg-gray-800/60 rounded-md" />
      <div className="flex justify-between items-center pt-3 border-t border-gray-800/40">
        <div className="w-20 h-4 bg-gray-800/40 rounded-md" />
        <div className="w-24 h-8 bg-gray-800 rounded-lg" />
      </div>
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="bg-[#0D111D] border border-gray-800/60 p-6 rounded-2xl animate-pulse space-y-2">
      <div className="w-20 h-3 bg-gray-800 rounded" />
      <div className="w-16 h-8 bg-gray-800/80 rounded" />
      <div className="w-32 h-3 bg-gray-800/40 rounded" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="w-full py-3.5 px-4 bg-[#0A0D16] border-b border-gray-800/50 flex items-center justify-between animate-pulse">
      <div className="w-24 h-4 bg-gray-800 rounded" />
      <div className="w-32 h-4 bg-gray-800/80 rounded" />
      <div className="w-20 h-4 bg-gray-800/60 rounded" />
      <div className="w-16 h-6 bg-gray-800 rounded-full" />
    </div>
  );
}
