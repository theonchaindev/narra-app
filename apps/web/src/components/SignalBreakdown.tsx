"use client";

import { useState } from "react";
import type { ScoreBreakdown } from "@bags-scout/shared";

interface SignalBreakdownProps {
  breakdown: ScoreBreakdown;
}

const signals = [
  { key: "engagement", label: "Engagement", max: 30 },
  { key: "keywords", label: "Build keywords", max: 20 },
  { key: "followerTier", label: "Follower tier", max: 20 },
  { key: "media", label: "Demo / media", max: 15 },
  { key: "github", label: "GitHub link", max: 10 },
  { key: "replies", label: "Reply activity", max: 5 },
] as const;

export function SignalBreakdown({ breakdown }: SignalBreakdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Signal breakdown
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {signals.map(({ key, label, max }) => {
            const value = breakdown[key] ?? 0;
            const pct = (value / max) * 100;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-white/40 w-28 shrink-0">{label}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-white/50 font-mono w-8 text-right">
                  {value}/{max}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
