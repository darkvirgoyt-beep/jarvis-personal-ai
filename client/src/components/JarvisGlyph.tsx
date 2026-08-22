import React from "react";
import { cn } from "@/lib/utils";

export function JarvisGlyph({ className, size = 40, status = "ready" }: { className?: string; size?: number; status?: "ready" | "active" | "guarded" }) {
  return (
    <span className={cn("jarvis-glyph", `jarvis-glyph--${status}`, className)} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" focusable="false">
        <defs>
          <linearGradient id="jarvis-glyph-spectrum" x1="10" y1="8" x2="55" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9af7ff" />
            <stop offset="0.5" stopColor="#46c9e8" />
            <stop offset="1" stopColor="#e38bff" />
          </linearGradient>
          <filter id="jarvis-glyph-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path className="jarvis-glyph__outer" d="M32 4 55.8 17.7v28.6L32 60 8.2 46.3V17.7L32 4Z" stroke="url(#jarvis-glyph-spectrum)" strokeWidth="1.4" />
        <path className="jarvis-glyph__inner" d="M32 14 47.1 22.7v18.6L32 50 16.9 41.3V22.7L32 14Z" stroke="url(#jarvis-glyph-spectrum)" strokeWidth="1.1" />
        <path className="jarvis-glyph__signal" d="M20 34.5h7.2l3.2-7.2 4.1 13.4 3.7-8.2H44" stroke="url(#jarvis-glyph-spectrum)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#jarvis-glyph-glow)" />
        <circle className="jarvis-glyph__core" cx="32" cy="32" r="3.1" fill="#d2fbff" />
        <circle cx="32" cy="7.2" r="1.6" fill="#9af7ff" /><circle cx="53.3" cy="19.5" r="1.6" fill="#e38bff" /><circle cx="10.7" cy="44.5" r="1.6" fill="#9af7ff" />
      </svg>
    </span>
  );
}

export function JarvisBrandLockup({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn("flex min-w-0 items-center gap-2.5", className)}><JarvisGlyph size={compact ? 30 : 38} status="active" /><div className="min-w-0"><p className="font-mono text-xs font-bold tracking-[0.27em] text-cyan-50">JARVIS</p>{!compact && <p className="mt-0.5 text-[9px] font-medium tracking-[0.2em] text-slate-500">SYNTHETIC INTELLIGENCE</p>}</div></div>;
}
