import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@bags-scout/db";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SignalBreakdown } from "@/components/SignalBreakdown";
import type { ScoreBreakdown } from "@bags-scout/shared";
import { OpportunityActions } from "@/components/OpportunityActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityPage({ params }: PageProps) {
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { builder: true, post: true, narrative: true },
  });

  if (!opportunity) notFound();

  const { builder, post, narrative, score, scoreBreakdown } = opportunity;
  const tweetUrl = `https://x.com/${builder.username}/status/${post.tweetId}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to feed
      </Link>

      {/* Builder header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {builder.profileImageUrl ? (
            <Image
              src={builder.profileImageUrl}
              alt={builder.displayName}
              width={56}
              height={56}
              className="rounded-full ring-2 ring-white/10"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-white/40">
              {builder.displayName[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{builder.displayName}</h1>
            <a
              href={`https://x.com/${builder.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/70 transition-colors text-sm"
            >
              @{builder.username}
            </a>
            {builder.bio && <p className="text-sm text-white/50 mt-1">{builder.bio}</p>}
          </div>
        </div>
        <ScoreBadge score={score} size="lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-lg font-bold">{builder.followerCount.toLocaleString()}</p>
          <p className="text-xs text-white/40">Followers</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-lg font-bold">{post.likeCount.toLocaleString()}</p>
          <p className="text-xs text-white/40">Likes</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-lg font-bold">{post.retweetCount.toLocaleString()}</p>
          <p className="text-xs text-white/40">Retweets</p>
        </div>
      </div>

      {/* Original post */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Original post</p>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
          >
            View on X
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <p className="text-white/80 leading-relaxed">{post.text}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {post.hasGithubLink && (
            <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/50">
              GitHub link
            </span>
          )}
          {post.hasMedia && (
            <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/50">
              Has media
            </span>
          )}
          {post.hasDemoLink && (
            <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/50">
              Demo link
            </span>
          )}
        </div>
      </div>

      {/* Signal breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-3">Signal Score</p>
        <SignalBreakdown breakdown={scoreBreakdown as unknown as ScoreBreakdown} />
      </div>

      {/* Narrative */}
      {narrative && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Generated Narrative</p>

          <div>
            <p className="text-xs text-white/30 mb-1">Project description</p>
            <p className="text-white/80">{narrative.projectDesc}</p>
          </div>

          <div>
            <p className="text-xs text-white/30 mb-1">Why it matters</p>
            <p className="text-white/80">{narrative.whyItMatters}</p>
          </div>

          <div>
            <p className="text-xs text-white/30 mb-1">Launch narrative</p>
            <p className="text-white/80">{narrative.launchNarrative}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-black/30 rounded-xl p-3">
              <p className="text-xs text-white/30 mb-1">Token name</p>
              <p className="font-semibold">{narrative.tokenName}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3">
              <p className="text-xs text-white/30 mb-1">Ticker</p>
              <p className="font-mono font-bold text-brand-400">${narrative.ticker}</p>
            </div>
          </div>

          <p className="text-xs text-white/20 pt-2">
            Community Support Launch — creator has not been verified or endorsed this launch.
          </p>
        </div>
      )}

      {/* Launch action */}
      <OpportunityActions opportunity={opportunity} />
    </div>
  );
}
