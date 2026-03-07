"use client";

import { useState } from "react";
import type { OpportunityWithRelations } from "@bags-scout/shared";
import { LaunchModal } from "./LaunchModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface OpportunityActionsProps {
  opportunity: OpportunityWithRelations | any;
}

export function OpportunityActions({ opportunity }: OpportunityActionsProps) {
  const [showLaunch, setShowLaunch] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}/narrate`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        setError(data.error ?? "Generation failed. Try again.");
        setGenerating(false);
      }
    } catch {
      setError("Network error. Try again.");
      setGenerating(false);
    }
  }

  if (!opportunity.narrative) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div>
          <p className="text-sm font-medium text-white/80">No narrative yet</p>
          <p className="text-xs text-white/40 mt-0.5">Generate an AI narrative to unlock the launch button.</p>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating narrative...
            </>
          ) : (
            "Generate Narrative"
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLaunch(true)}
        className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-2xl transition-colors text-base"
      >
        Launch via Bags
      </button>

      {showLaunch && (
        <LaunchModal opportunity={opportunity} onClose={() => setShowLaunch(false)} />
      )}
    </>
  );
}
