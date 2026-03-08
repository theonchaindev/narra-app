"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { OpportunityWithRelations } from "@bags-scout/shared";
import { LaunchModal } from "./LaunchModal";

const CHARITABLE_KEYWORDS = ["gofundme", "fundraising", "donation", "charity", "nonprofit", "please help", "crowdfund"];

function scoreColor(score: number) {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

export function NarrativeCard({ opportunity, featured = false }: { opportunity: OpportunityWithRelations; featured?: boolean }) {
  const { builder, post, narrative, score } = opportunity;
  const [showLaunch, setShowLaunch] = useState(false);

  const tweetUrl = `https://x.com/${builder.username}/status/${post.tweetId}`;
  const isCharitable = CHARITABLE_KEYWORDS.some(kw => post.text.toLowerCase().includes(kw));

  return (
    <>
      <div className={`group flex flex-col bg-[#0e0e0e] border border-white/8 rounded-2xl overflow-hidden transition-all hover:border-white/16 hover:bg-[#111] ${featured ? "md:flex-row" : ""}`}>

        {/* Charitable stripe */}
        {isCharitable && (
          <div className="h-0.5 bg-gradient-to-r from-blue-500/60 to-transparent" />
        )}

        <div className={`flex flex-col flex-1 p-5 gap-4 ${featured ? "md:p-6" : ""}`}>

          {/* ── Builder row ── */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {builder.profileImageUrl ? (
                <Image
                  src={builder.profileImageUrl}
                  alt={builder.displayName}
                  width={36}
                  height={36}
                  className="rounded-full ring-1 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-sm font-bold text-white/40 shrink-0">
                  {builder.displayName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">{builder.displayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <a
                    href={`https://x.com/${builder.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/35 hover:text-white/60 transition-colors"
                  >
                    @{builder.username}
                  </a>
                  <span className="text-white/15 text-xs">·</span>
                  <span className="text-xs text-white/25">{(builder.followerCount / 1000).toFixed(builder.followerCount >= 1000 ? 1 : 0)}{builder.followerCount >= 1000 ? "k" : ""}</span>
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="shrink-0 text-right">
              <span className={`text-lg font-bold font-mono leading-none ${scoreColor(score)}`}>{score}</span>
              <p className="text-[9px] text-white/20 uppercase tracking-wider mt-0.5">signal</p>
            </div>
          </div>

          {/* ── Tweet ── */}
          <p className="text-sm text-white/55 leading-relaxed line-clamp-3 -mt-1">
            {post.text}
          </p>

          {/* ── Signal tags + X link ── */}
          <div className="flex items-center gap-1.5 flex-wrap -mt-1">
            {post.hasGithubLink && <Tag>GitHub</Tag>}
            {post.hasMedia && <Tag>Demo</Tag>}
            {post.hasDemoLink && <Tag>Live</Tag>}
            <Tag>{post.likeCount} ♥</Tag>
            {post.retweetCount > 0 && <Tag>{post.retweetCount} RT</Tag>}
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[11px] text-white/20 hover:text-white/50 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              View
            </a>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-white/6" />

          {/* ── Narrative / Token ── */}
          {narrative ? (
            <>
              <div className="-mt-1">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-mono font-bold text-brand-400 text-base">${narrative.ticker}</span>
                  <span className="text-xs text-white/30">{narrative.tokenName}</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                  {narrative.projectDesc}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/opportunity/${opportunity.id}`}
                  className="flex-1 text-center py-2 text-xs text-white/40 hover:text-white/70 border border-white/8 hover:border-white/15 rounded-xl transition-colors"
                >
                  Read narrative
                </Link>
                <button
                  onClick={() => setShowLaunch(true)}
                  className="flex-1 py-2 text-sm bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl transition-colors"
                >
                  Launch
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
              Generating narrative...
            </div>
          )}
        </div>
      </div>

      {showLaunch && narrative && (
        <LaunchModal opportunity={opportunity} onClose={() => setShowLaunch(false)} />
      )}
    </>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] text-white/30 bg-white/4 border border-white/6 px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}
