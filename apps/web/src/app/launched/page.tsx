import Image from "next/image";
import Link from "next/link";
import { prisma } from "@bags-scout/db";
import { ScoreBadge } from "@/components/ScoreBadge";

export const dynamic = "force-dynamic";

export default async function LaunchedPage() {
  const launched = await prisma.opportunity.findMany({
    where: {
      status: { in: ["NARRATED", "LAUNCHED"] },
      narrative: { isNot: null },
    },
    include: { builder: true, post: true, narrative: true },
    orderBy: { createdAt: "desc" },
  });

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
          {launched.length} narrative{launched.length !== 1 ? "s" : ""} launched
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {launched.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-lg mb-2">No launches yet</p>
            <p className="text-white/20 text-sm mb-6">
              Discover builders and launch the first narrative.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-black font-semibold rounded-xl transition-colors inline-block"
            >
              Go to Discovery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {launched.map((opp) => {
              const { builder, narrative, score } = opp;
              if (!narrative) return null;
              return (
                <Link
                  key={opp.id}
                  href={`/opportunity/${opp.id}`}
                  className="group bg-[#111] border border-white/10 rounded-2xl p-5 hover:border-brand-500/40 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {builder.profileImageUrl ? (
                        <img
                          src={builder.profileImageUrl}
                          alt={builder.displayName}
                          width={40}
                          height={40}
                          className="rounded-full ring-2 ring-white/10"
                        />
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

                  {/* Token */}
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

                  {/* Narrative */}
                  <p className="text-sm text-white/60 leading-relaxed line-clamp-3 mb-4">
                    {narrative.projectDesc}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-white/30">
                    <span>{builder.followerCount.toLocaleString()} followers</span>
                    <span className="group-hover:text-brand-400 transition-colors">
                      View narrative →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
