import Link from "next/link";

export const metadata = { title: "BuildStream $BSTR — Narra" };

const DEMO = {
  tokenName: "BuildStream",
  ticker: "BSTR",
  builderName: "Alex Mercer",
  builderHandle: "alexmercer",
  followerCount: 12400,
  score: 87,
  launchDate: "Mar 5, 2026",
  price: 0.001425,
  priceChange24h: +18.4,
  marketCap: 142500,
  volume24h: 28400,
  holders: 341,
  totalSupply: 100_000_000,
  projectDesc: "A real-time builder activity aggregator that surfaces the most active open-source contributors across GitHub, X, and Farcaster — turning raw signal into community momentum.",
  whyItMatters: "Developer activity is the most honest signal in crypto. BuildStream makes it legible and tradeable for the first time.",
  launchNarrative: "Alex Mercer has been shipping in public for 18 months — 400+ GitHub commits, a Farcaster audience of 12k, and a product that keeps getting better. The community saw it before the market did.",
  feeClaims: [
    { date: "Mar 8, 2026 · 14:32 UTC", amount: 0.84, sol: 0.0059, tx: "4xKm...9rPq" },
    { date: "Mar 7, 2026 · 21:10 UTC", amount: 1.22, sol: 0.0086, tx: "7nWs...2fJt" },
    { date: "Mar 7, 2026 · 08:44 UTC", amount: 0.67, sol: 0.0047, tx: "Bq3L...vR8c" },
    { date: "Mar 6, 2026 · 17:55 UTC", amount: 2.11, sol: 0.0148, tx: "Nk9Z...mD1x" },
    { date: "Mar 6, 2026 · 06:20 UTC", amount: 0.38, sol: 0.0027, tx: "Yw7C...aE5p" },
    { date: "Mar 5, 2026 · 19:01 UTC", amount: 3.50, sol: 0.0245, tx: "Lp2Q...hF4n" },
  ],
};

const totalFees = DEMO.feeClaims.reduce((s, c) => s + c.sol, 0);

function StatCard({ label, value, sub, green }: { label: string; value: string; sub?: string; green?: boolean }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
      <p className="text-xs text-white/35 mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${green ? "text-green-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

// Sparkline — purely decorative SVG path
function Sparkline() {
  const points = [48, 42, 55, 44, 38, 50, 35, 45, 28, 38, 22, 30, 18, 25, 12];
  const h = 60;
  const w = 300;
  const step = w / (points.length - 1);
  const max = Math.max(...points);
  const coords = points.map((p, i) => `${i * step},${h - (p / max) * h}`).join(" L ");
  const fill = `M ${coords} L ${w},${h} L 0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${coords}`} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={fill} fill="url(#sg)" />
    </svg>
  );
}

export default function DemoLaunchPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

      {/* Back + demo banner */}
      <div className="flex items-center justify-between">
        <Link href="/launched" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Launched
        </Link>
        <span className="text-[10px] font-bold px-3 py-1 bg-brand-500/15 border border-brand-500/30 text-brand-400 rounded-full tracking-widest uppercase">
          Demo
        </span>
      </div>

      {/* Token hero */}
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/40 to-purple-500/40 border border-white/10 flex items-center justify-center text-2xl font-bold text-white/70">
              B
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold">{DEMO.tokenName}</h1>
                <span className="font-mono text-brand-400 font-bold">${DEMO.ticker}</span>
              </div>
              <p className="text-sm text-white/40">by <a href={`https://x.com/${DEMO.builderHandle}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">@{DEMO.builderHandle}</a> · launched {DEMO.launchDate}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono">${DEMO.price.toFixed(6)}</p>
            <p className="text-sm font-semibold text-green-400">+{DEMO.priceChange24h}% (24h)</p>
          </div>
        </div>

        {/* Sparkline */}
        <div className="mb-1">
          <Sparkline />
        </div>
        <p className="text-[10px] text-white/20 text-right mb-4">7-day price (demo data)</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Market Cap" value={`$${(DEMO.marketCap / 1000).toFixed(1)}k`} sub="USD" />
          <StatCard label="Volume 24h" value={`$${(DEMO.volume24h / 1000).toFixed(1)}k`} sub="USD" green />
          <StatCard label="Holders" value={DEMO.holders.toLocaleString()} sub="wallets" />
          <StatCard label="Signal Score" value={`${DEMO.score}`} sub="/ 100" green />
        </div>
      </div>

      {/* Narrative */}
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Narrative</h2>
        <p className="text-white/80 leading-relaxed">{DEMO.launchNarrative}</p>
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-white/35 mb-1.5">Project</p>
            <p className="text-sm text-white/70 leading-relaxed">{DEMO.projectDesc}</p>
          </div>
          <div>
            <p className="text-xs text-white/35 mb-1.5">Why it matters</p>
            <p className="text-sm text-white/70 leading-relaxed">{DEMO.whyItMatters}</p>
          </div>
        </div>
      </div>

      {/* Fee claims */}
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Fee Claims</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">Total collected</span>
            <span className="font-mono font-semibold text-brand-400 text-sm">{totalFees.toFixed(4)} SOL</span>
          </div>
        </div>

        {/* Summary pills */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-brand-500/8 border border-brand-500/15 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] text-white/30 mb-1">Total Claims</p>
            <p className="font-bold text-brand-400">{DEMO.feeClaims.length}</p>
          </div>
          <div className="bg-brand-500/8 border border-brand-500/15 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] text-white/30 mb-1">SOL Claimed</p>
            <p className="font-bold text-brand-400 font-mono">{totalFees.toFixed(4)}</p>
          </div>
          <div className="bg-brand-500/8 border border-brand-500/15 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] text-white/30 mb-1">Avg per Claim</p>
            <p className="font-bold text-brand-400 font-mono">{(totalFees / DEMO.feeClaims.length).toFixed(4)}</p>
          </div>
        </div>

        {/* History table */}
        <div className="space-y-2">
          {DEMO.feeClaims.map((claim, i) => (
            <div key={i} className="flex items-center justify-between bg-white/3 hover:bg-white/5 border border-white/6 rounded-xl px-4 py-3 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/70">Fee Claimed</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{claim.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold font-mono text-green-400">+{claim.sol.toFixed(4)} SOL</p>
                <a
                  href={`https://solscan.io/tx/${claim.tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-white/20 hover:text-brand-400 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  {claim.tx}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Token info */}
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Token Info</h2>
        <div className="space-y-3">
          {[
            ["Total Supply", `${(DEMO.totalSupply / 1_000_000).toFixed(0)}M ${DEMO.ticker}`],
            ["Builder Followers", DEMO.followerCount.toLocaleString()],
            ["Launch Platform", "Narra × Bags"],
            ["Chain", "Solana"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <span className="text-white/40">{k}</span>
              <span className="text-white/75 font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-white/20 pb-4">
        This is a demo page showing what a launched token looks like on Narra. All data is simulated.
      </p>
    </div>
  );
}
