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

  if (!opportunity.narrative) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
        <p className="text-white/40 text-sm">Narrative is being generated...</p>
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
