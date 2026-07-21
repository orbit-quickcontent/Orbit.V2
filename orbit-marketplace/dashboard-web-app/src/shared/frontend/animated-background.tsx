"use client";

/**
 * 🟡 SHARED | AnimatedBackground
 *
 * Subtle floating geometric shapes that move slowly across the screen.
 * Uses orbit-cyan (#00BFFF) and orbit-purple (#A020F0) at low opacity.
 * Three element types: floating circles, rotating ring outlines, and
 * gradient mesh blobs. All elements are pointer-events-none.
 *
 * Performance optimizations:
 * - No CSS filter:blur (uses soft multi-stop radial gradients instead)
 * - Reduced element counts (5 circles, 2 rings, 2 blobs)
 * - will-change:transform for GPU-accelerated compositing
 * - prefers-reduced-motion media query support
 * - Capped animation durations (≤25s)
 * - Style tag dedup via id check
 *
 * Used by: client-app.tsx, partner-app.tsx
 * Category: Shared UI
 */

import { useMemo } from "react";

// ─── Animated Background ─────────────────────────────────────────────────────
// Subtle floating geometric shapes that move slowly across the screen.
// Uses orbit-cyan (#00BFFF) and orbit-purple (#A020F0) at low opacity.
// All elements are pointer-events-none so they don't interfere with clicks.

interface FloatingCircle {
  id: number;
  size: number;
  x: number;
  y: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
  translateX: number;
  translateY: number;
}

interface RotatingRing {
  id: number;
  size: number;
  x: number;
  y: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
}

interface GradientBlob {
  id: number;
  size: number;
  x: number;
  y: number;
  opacity: number;
  duration: number;
  delay: number;
  translateX: number;
  translateY: number;
}

/** Unique id for the inline <style> tag to prevent duplicate injection */
const STYLE_ID = "orbit-bg-keyframes";

export default function AnimatedBackground() {
  // Only inject <style> if not already present in the DOM (e.g. from another instance)
  const shouldInjectStyles = useMemo(() => {
    if (typeof document === "undefined") return true; // SSR: always render
    return !document.getElementById(STYLE_ID);
  }, []);

  // Generate stable elements with useMemo so they don't regenerate on re-renders
  const circles = useMemo<FloatingCircle[]>(() => {
    const items: FloatingCircle[] = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        id: i,
        size: 4 + (i * 3.4) % 17, // 4px to ~20px
        x: ((i * 13 + 7) % 95) + 2, // 2% to 97%
        y: ((i * 19 + 11) % 90) + 5, // 5% to 95%
        color: i % 2 === 0 ? "#00BFFF" : "#A020F0",
        opacity: 0.05 + (i % 3) * 0.04, // 5% to 13%
        duration: 15 + (i * 2) % 11, // 15s to 26s
        delay: (i * 1.7) % 8, // 0s to 8s
        translateX: ((i * 23 % 40) - 20), // -20px to 20px
        translateY: ((i * 17 % 30) - 15), // -15px to 15px
      });
    }
    return items;
  }, []);

  const rings = useMemo<RotatingRing[]>(() => {
    const items: RotatingRing[] = [];
    const ringConfigs = [
      { size: 120, x: 15, y: 25 },
      { size: 80, x: 75, y: 60 },
    ];
    ringConfigs.forEach((cfg, i) => {
      items.push({
        id: i,
        size: cfg.size,
        x: cfg.x,
        y: cfg.y,
        color: i % 2 === 0 ? "#00BFFF" : "#A020F0",
        opacity: 0.06 + (i % 2) * 0.04, // 6% to 10%
        duration: 20 + i * 5, // 20s to 25s
        delay: i * 3, // 0s to 3s
      });
    });
    return items;
  }, []);

  const blobs = useMemo<GradientBlob[]>(() => {
    return [
      { id: 0, size: 350, x: 20, y: 30, opacity: 0.06, duration: 25, delay: 0, translateX: 30, translateY: -20 },
      { id: 1, size: 280, x: 70, y: 70, opacity: 0.07, duration: 20, delay: 5, translateX: -25, translateY: 15 },
    ];
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Inline keyframes — only injected once per DOM */}
      {shouldInjectStyles && (
        <style id={STYLE_ID}>{`
          @keyframes orbit-bg-float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(var(--tx), var(--ty)) scale(1.05); }
            50% { transform: translate(calc(var(--tx) * -0.5), calc(var(--ty) * 0.7)) scale(0.95); }
            75% { transform: translate(calc(var(--tx) * 0.7), calc(var(--ty) * -0.5)) scale(1.02); }
          }
          @keyframes orbit-bg-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes orbit-bg-drift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(var(--tx), var(--ty)) scale(1.1); }
            66% { transform: translate(calc(var(--tx) * -0.7), calc(var(--ty) * -0.5)) scale(0.9); }
          }
          @media (prefers-reduced-motion: reduce) {
            [data-orbit-bg] {
              animation: none !important;
            }
          }
        `}</style>
      )}

      {/* Floating Circles */}
      {circles.map((c) => (
        <div
          key={`circle-${c.id}`}
          data-orbit-bg
          className="absolute rounded-full"
          style={{
            width: `${c.size}px`,
            height: `${c.size}px`,
            left: `${c.x}%`,
            top: `${c.y}%`,
            backgroundColor: c.color,
            opacity: c.opacity,
            willChange: "transform",
            animation: `orbit-bg-float ${c.duration}s ease-in-out ${c.delay}s infinite`,
            ["--tx" as string]: `${c.translateX}px`,
            ["--ty" as string]: `${c.translateY}px`,
          }}
        />
      ))}

      {/* Rotating Rings */}
      {rings.map((r) => (
        <div
          key={`ring-${r.id}`}
          data-orbit-bg
          className="absolute rounded-full"
          style={{
            width: `${r.size}px`,
            height: `${r.size}px`,
            left: `${r.x}%`,
            top: `${r.y}%`,
            border: `1px solid ${r.color}`,
            opacity: r.opacity,
            willChange: "transform",
            animation: `orbit-bg-spin ${r.duration}s linear ${r.delay}s infinite`,
            marginLeft: `-${r.size / 2}px`,
            marginTop: `-${r.size / 2}px`,
          }}
        />
      ))}

      {/* Gradient Mesh Blobs — soft multi-stop radial gradient, no CSS filter:blur */}
      {blobs.map((b) => (
        <div
          key={`blob-${b.id}`}
          data-orbit-bg
          className="absolute rounded-full"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.x}%`,
            top: `${b.y}%`,
            background: `radial-gradient(circle, rgba(0, 191, 255, ${b.opacity}) 0%, rgba(0, 191, 255, ${b.opacity * 0.5}) 20%, rgba(160, 32, 240, ${b.opacity * 0.4}) 40%, rgba(160, 32, 240, ${b.opacity * 0.15}) 65%, transparent 85%)`,
            willChange: "transform",
            animation: `orbit-bg-drift ${b.duration}s ease-in-out ${b.delay}s infinite`,
            ["--tx" as string]: `${b.translateX}px`,
            ["--ty" as string]: `${b.translateY}px`,
          }}
        />
      ))}
    </div>
  );
}