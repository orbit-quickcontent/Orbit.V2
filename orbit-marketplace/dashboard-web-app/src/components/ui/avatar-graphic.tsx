"use client";

import React from "react";

export function AvatarGraphic({ id, size = 64 }: { id: string; size?: number }) {
  switch (id) {
    case "creator":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="50" cy="50" r="50" fill="#FF4D4D" />
          {/* Shirt */}
          <path d="M25 88 C 25 72, 35 68, 50 68 C 65 68, 75 72, 75 88 Z" fill="#FFFFFF" />
          {/* Head & Neck */}
          <circle cx="50" cy="50" r="18" fill="#FFD1B3" />
          <rect x="46" y="62" width="8" height="10" fill="#E8B092" />
          {/* Cap / Hair */}
          <path d="M30 42 C 30 28, 70 28, 70 42 Z" fill="#1A1A1A" />
          <path d="M26 44 C 26 38, 74 38, 74 44 Z" fill="#0F1115" />
          {/* Eyes */}
          <ellipse cx="44" cy="48" rx="2" ry="2.5" fill="#1A1A1A" />
          <ellipse cx="56" cy="48" rx="2" ry="2.5" fill="#1A1A1A" />
          {/* Beard / Mustache */}
          <path d="M42 56 Q 50 60 58 56 Q 50 64 42 56 Z" fill="#1A1A1A" />
          <path d="M40 52 C 45 55, 48 55, 50 53 C 52 55, 55 55, 60 52 C 58 57, 42 57, 40 52 Z" fill="#1A1A1A" />
        </svg>
      );
    case "professional":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="50" cy="50" r="50" fill="#3A82F6" />
          {/* Suit */}
          <path d="M22 88 C 22 70, 32 66, 50 66 C 68 66, 78 70, 78 88 Z" fill="#1E293B" />
          <path d="M44 66 L 50 78 L 56 66 Z" fill="#FFFFFF" />
          <path d="M48 66 L 50 82 L 52 66 Z" fill="#FF4D4D" />
          {/* Head */}
          <circle cx="50" cy="46" r="17" fill="#FFD1B3" />
          {/* Hair */}
          <path d="M33 42 C 33 26, 67 26, 67 42 C 67 36, 33 36, 33 42 Z" fill="#475569" />
          {/* Glasses */}
          <circle cx="43" cy="46" r="6" stroke="#1E293B" strokeWidth="2" fill="none" />
          <circle cx="57" cy="46" r="6" stroke="#1E293B" strokeWidth="2" fill="none" />
          <line x1="49" y1="46" x2="51" y2="46" stroke="#1E293B" strokeWidth="2" />
          {/* Smile */}
          <path d="M45 55 Q 50 59 55 55" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "artist":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="50" cy="50" r="50" fill="#FFC107" />
          {/* Clothes */}
          <path d="M24 88 C 24 72, 34 68, 50 68 C 66 68, 76 72, 76 88 Z" fill="#581C87" />
          {/* Head */}
          <circle cx="50" cy="48" r="17" fill="#FFD1B3" />
          {/* Hair */}
          <path d="M33 44 C 33 28, 67 28, 67 44 C 60 30, 40 30, 33 44 Z" fill="#18181B" />
          {/* Eyes */}
          <circle cx="43" cy="48" r="2.5" fill="#18181B" />
          <circle cx="57" cy="48" r="2.5" fill="#18181B" />
          {/* Smile */}
          <path d="M44 56 Q 50 60 56 56" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "explorer":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="50" cy="50" r="50" fill="#00C853" />
          {/* Explorer Jacket */}
          <path d="M22 88 C 22 72, 32 68, 50 68 C 68 68, 78 72, 78 88 Z" fill="#047857" />
          {/* Head */}
          <circle cx="50" cy="48" r="17" fill="#FFD1B3" />
          {/* Explorer Hat */}
          <path d="M28 42 C 28 32, 72 32, 72 42 Z" fill="#065F46" />
          <rect x="22" y="40" width="56" height="5" rx="2.5" fill="#FFC107" />
          {/* Eyes */}
          <circle cx="43" cy="49" r="2.5" fill="#064E3B" />
          <circle cx="57" cy="49" r="2.5" fill="#064E3B" />
          {/* Smile */}
          <path d="M44 56 Q 50 60 56 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "celebration":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="50" cy="50" r="50" fill="#B033FF" />
          {/* Party Top */}
          <path d="M24 88 C 24 72, 34 68, 50 68 C 66 68, 76 72, 76 88 Z" fill="#3B82F6" />
          {/* Head */}
          <circle cx="50" cy="48" r="17" fill="#FFD1B3" />
          {/* Hair */}
          <path d="M32 44 C 32 26, 68 26, 68 44 C 64 30, 36 30, 32 44 Z" fill="#D894FF" />
          {/* Eyes */}
          <circle cx="43" cy="48" r="2.5" fill="#3B0764" />
          <circle cx="57" cy="48" r="2.5" fill="#3B0764" />
          {/* Joyful Smile */}
          <path d="M42 55 Q 50 62 58 55" stroke="#3B0764" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
  }
}
