"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { OpportunityWithRelations } from "@bags-scout/shared";
import { ScoreBadge } from "./ScoreBadge";
import { LaunchModal } from "./LaunchModal";

const CHARITABLE_KEYWORDS = ["gofundme", "fundraising", "donation", "charity", "nonprofit", "please help", "crowdfund"];

export function NarrativeCard({ opportunity, featured = false }: { opportunity: OpportunityWithRelations; featured?: boolean }) {
  const { builder, post, narrative, score } = opportunity;
  const [showLaunch, setShowLaunch] = useState(false);

  const tweetUrl = `https://x.com/${builder.username}/status/${post.tweetId}`;
  const isCharitable = CHARITABLE_KEYWORDS.some(kw => post.text.toLowerCase().includes(kw));

  return (
    <>
      <div className={`group bg-[#111] border rounded-2xl overflow-hidden transition-all hover:border-white/20 ${featured ? "border-white/15" : "border-white/10"}`}>
        {isCharitable && (
          <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-xs text-blue-400 font-medium">Charitable cause</span>
          </div>
        )}

        <div className={`p-5 ${featured ? "sm:flex sm:gap-6" : ""}`}>
          {/* Left */}
          <div className={featured ? "flex-1 min-w-0" : ""}>
            {/* Builder */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                {builder.profileImageUrl ? (
                  <Image src={builder.profileImageUrl} alt={builder.displayName} width={featured ? 44 : 38} height={featured ? 44 : 38} className="rounded-full ring-2 ring-white/10 shrink-0" />
                ) : (
                  <div className={`rounded-full bg-white/10 flex items-center justify-center font-bold text-white/40 shrink-0 ${featured ? "w-11 h-11 text-base" : "w-9 h-9 text-sm"}`}>
                    {builder.displayName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`font-semibold leading-tight truncate ${featured ? "text-base" : "text-sm"}`}>{builder.displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <a href={`https://x.com/${builder.username}`} target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                      @{builder.username}
                    </a>
                    <span className="text-white/20">·</span>
                    <span className="text-xs text-white/30">{builder.followerCount.toLocaleString()} followers</span>
                  </div>
                </div>
              </div>
              <ScoreBadge score={score} size={featured ? "md" : "sm"} />
            </div>

            {/* Post excerpt */}
            <div className="mb-4">
              <p className={`text-white/60 leading-relaxed mb-2 ${featured ? "text-sm line-clamp-4" : "text-xs line-clamp-3"}`}>
                {post.text}
              </p>
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                View on X
              </a>
            </div>

            {/* Signal chips */}
            <div className="flex flex-wrap gap-1.5">
              {post.hasGithubLink && <Chip>GitHub</Chip>}
              {post.hasMedia && <Chip>Demo</Chip>}
              {post.hasDemoLink && <Chip>Live link</Chip>}
              <Chip>{post.likeCount} likes</Chip>
              {post.retweetCount > 0 && <Chip>{post.retweetCount} RTs</Chip>}
            </div>
          </div>

          {/* Narrative / Launch */}
          <div className={`${featured ? "sm:w-72 sm:shrink-0 mt-4 sm:mt-0" : "mt-4"}`}>
            {narrative ? (
              <>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                  <p className="text-[10px] text-white/35 font-medium uppercase tracking-wider mb-2">Narrative</p>
                  <p className={`text-white/70 leading-relaxed mb-3 ${featured ? "text-sm" : "text-xs"}`}>{narrative.projectDesc}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-400 text-sm">${narrative.ticker}</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-xs text-white/45">{narrative.tokenName}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/opportunity/${opportunity.id}`} className="flex-1 text-center py-2 text-xs text-white/45 hover:text-white/75 border border-white/10 hover:border-white/20 rounded-xl transition-colors">
                    Full narrative
                  </Link>
                  <button onClick={() => setShowLaunch(true)} className="flex-1 py-2 text-sm bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl transition-colors">
                    Launch
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white/3 border border-dashed border-white/10 rounded-xl p-4 text-center">
                <p className="text-xs text-white/25">Generating narrative...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLaunch && narrative && (
        <LaunchModal opportunity={opportunity} onClose={() => setShowLaunch(false)} />
      )}
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] text-white/40 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">{children}</span>;
}
