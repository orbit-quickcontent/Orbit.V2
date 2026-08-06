import React from "react";

interface OrbitSkeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  accent?: string;
  isSecondary?: boolean;
}

export const OrbitSkeuButton: React.FC<OrbitSkeuButtonProps> = ({
  label,
  accent = "#2563EB",
  isSecondary = false,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={`relative inline-flex items-center justify-center px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-180 ease-out active:translate-y-0.5 select-none ${
        disabled
          ? "bg-gray-200 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed"
          : isSecondary
          ? "bg-gradient-to-b from-white to-[#E7ECF2] text-[#111827] border border-[#D1D5DB] shadow-[-3px_-3px_6px_rgba(255,255,255,0.95),4px_6px_12px_rgba(0,0,0,0.12)] active:shadow-[0_1px_2px_rgba(0,0,0,0.10)]"
          : "bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white border border-[#2563EB]/60 shadow-[-3px_-3px_6px_rgba(255,255,255,0.30),4px_6px_14px_rgba(37,99,235,0.35)] active:shadow-[0_1px_2px_rgba(0,0,0,0.20)]"
      } ${className}`}
      {...props}
    >
      {label}
    </button>
  );
};

interface OrbitSkeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const OrbitSkeuCard: React.FC<OrbitSkeuCardProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-[#F7F9FC] border border-[#E5E7EB] rounded-3xl p-6 shadow-[-4px_-4px_10px_rgba(255,255,255,0.90),6px_8px_16px_rgba(0,0,0,0.08)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const OrbitSkeuPill: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
        isOnline
          ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/40"
          : "bg-gray-100 text-gray-500 border-gray-200"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          isOnline ? "bg-[#10B981] animate-pulse" : "bg-gray-400"
        }`}
      />
      {isOnline ? "ONLINE" : "OFFLINE"}
    </div>
  );
};
