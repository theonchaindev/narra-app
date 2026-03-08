import Image from "next/image";
import Link from "next/link";
import { prisma } from "@bags-scout/db";
import { ScoreBadge } from "@/components/ScoreBadge";

export const dynamic = "force-dynamic";

const DEMO = {
  tokenName: "BuildStream",
  ticker: "BSTR",
  projectDesc: "A real-time builder activity aggregator that surfaces the most active open-source contributors across GitHub, X, and Farcaster — turning raw signal into community momentum.",
  builderName: "Alex Mercer",
  builderHandle: "alexmercer",
  followerCount: 12400,
  score: 87,
  marketCap: 142500,
  volume24h: 28400,
};

export default async function LaunchedPage() {
  const launched = await prisma.opportunity.findMany({
    where: {
      status: { in: ["NARRATED", "LAUNCHED"] },
      narrative: { isNot: null },
    },
    include: { builder: true, post: true, narrative: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCount = launched.length + 1; // +1 for demo

  return (
    <div>
      {/* Hero */}
      <div className="border-b border-white/10 px-6 py-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Image src="/narra-logo.png" alt="Narra" width={40} height={40} className="rounded-xl" />
          <h1 className="text-3xl font-bold tracking-tight">Launched via Narra</h1>
        </div>
        <p className="text-white/50 max-w-xl mx-auto">
          Every token launched here started as a builder signal. Community-backed. Narrative-driven.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-400 px-4 py-1.5 rounded-full text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          {totalCount} narrative{totalCount !== 1 ? "s" : ""} launched
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* ── Demo card ── */}
          <Link
            href="/launched/demo"
            className="group relative bg-[#111] border border-green-500/30 rounded-2xl p-5 hover:border-green-500/60 transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(74,222,128,0.12),0_0_24px_rgba(74,222,128,0.08)]"
          >
            {/* Demo badge */}
            <span className="absolute top-3.5 right-3.5 text-[9px] font-bold px-2 py-0.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full tracking-widest uppercase">
              Demo
            </span>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pr-14">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/40 to-purple-500/40 border border-white/10 flex items-center justify-center font-bold text-white/70 shrink-0 text-sm">
                A
              </div>
              <div>
                <p className="font-semibold text-sm">{DEMO.builderName}</p>
                <p className="text-xs text-white/40">@{DEMO.builderHandle}</p>
              </div>
            </div>

            {/* Token bar */}
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-400/70 mb-0.5">Token</p>
                <p className="font-semibold text-brand-300">{DEMO.tokenName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-400/70 mb-0.5">Ticker</p>
                <p className="font-mono font-bold text-brand-400 text-lg">${DEMO.ticker}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-white/30 mb-0.5">Mkt Cap</p>
                <p className="text-xs font-semibold text-white/80">${(DEMO.marketCap / 1000).toFixed(1)}k</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-white/30 mb-0.5">Vol 24h</p>
                <p className="text-xs font-semibold text-green-400">${(DEMO.volume24h / 1000).toFixed(1)}k</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-white/30 mb-0.5">Signal</p>
                <p className="text-xs font-semibold text-brand-400">{DEMO.score}/100</p>
              </div>
            </div>

            <p className="text-sm text-white/55 leading-relaxed line-clamp-2 mb-4">
              {DEMO.projectDesc}
            </p>

            <div className="flex items-center justify-between text-xs text-white/30">
              <span>{DEMO.followerCount.toLocaleString()} followers</span>
              <span className="group-hover:text-brand-400 transition-colors">View token →</span>
            </div>
          </Link>

          {/* ── Real launched tokens ── */}
          {launched.map((opp) => {
            const { builder, narrative, score } = opp;
            if (!narrative) return null;
            return (
              <Link
                key={opp.id}
                href={`/opportunity/${opp.id}`}
                className="group bg-[#111] border border-white/10 rounded-2xl p-5 hover:border-brand-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {builder.profileImageUrl ? (
                      <img src={builder.profileImageUrl} alt={builder.displayName} width={40} height={40} className="rounded-full ring-2 ring-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/40">
                        {builder.displayName[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{builder.displayName}</p>
                      <p className="text-xs text-white/40">@{builder.username}</p>
                    </div>
                  </div>
                  <ScoreBadge score={score} size="sm" />
                </div>

                <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-brand-400/70 mb-0.5">Token</p>
                    <p className="font-semibold text-brand-300">{narrative.tokenName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-400/70 mb-0.5">Ticker</p>
                    <p className="font-mono font-bold text-brand-400 text-lg">${narrative.ticker}</p>
                  </div>
                </div>

                <p className="text-sm text-white/60 leading-relaxed line-clamp-3 mb-4">
                  {narrative.projectDesc}
                </p>

                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>{builder.followerCount.toLocaleString()} followers</span>
                  <span className="group-hover:text-brand-400 transition-colors">View narrative →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
