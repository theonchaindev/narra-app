"use client";

import { useState, useEffect, useCallback } from "react";
import type { OpportunityWithRelations } from "@bags-scout/shared";
import { NarrativeCard } from "./NarrativeCard";

type Filter = "all" | "builders" | "charitable" | "high";

const CHARITABLE_KW = ["gofundme", "fundraising", "donation", "charity", "nonprofit", "please help", "crowdfund", "need funds"];

function applyFilter(opps: OpportunityWithRelations[], filter: Filter) {
  if (filter === "all") return opps;
  if (filter === "high") return opps.filter(o => o.score >= 60);
  if (filter === "charitable") return opps.filter(o => CHARITABLE_KW.some(kw => o.post.text.toLowerCase().includes(kw)));
  if (filter === "builders") return opps.filter(o => !CHARITABLE_KW.some(kw => o.post.text.toLowerCase().includes(kw)));
  return opps;
}

export function BuilderFeed() {
  const [opportunities, setOpportunities] = useState<OpportunityWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<{ message: string; setupRequired?: boolean } | null>(null);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), sort: "score", min: "0", ...(q ? { q } : {}) });
      const res = await fetch(`/api/opportunities?${params}`);
      const data = await res.json();
      setOpportunities(data.opportunities ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  // Auto-scan on first load if no opportunities yet
  useEffect(() => {
    fetchOpportunities().then(() => {
      setOpportunities(prev => {
        if (prev.length === 0) triggerScan();
        return prev;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (page > 1 || q) fetchOpportunities();
  }, [page, q, fetchOpportunities]);

  async function triggerScan() {
    setScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setScanError({ message: data.error ?? "Scan failed" });
        return;
      }
      if (data.setupRequired || data.method === "none") {
        setScanError({ message: data.error ?? "X API not configured", setupRequired: data.setupRequired });
        return;
      }
      const method = data.method === "search" ? "X search" : "watched builders";
      const newCount = data.newPosts ?? 0;
      const generated = data.narrativesGenerated ?? 0;
      if (newCount === 0) {
        setScanResult(`No new posts found via ${method} — all up to date`);
      } else {
        setScanResult(`+${newCount} posts · ${generated} narratives (${method})`);
      }
      await fetchOpportunities();
    } finally {
      setScanning(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
  }

  const filtered = applyFilter(opportunities, filter);
  const [top, ...rest] = filtered;
  const totalPages = Math.ceil(total / 20);

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "builders", label: "Builders" },
    { key: "charitable", label: "Charitable" },
    { key: "high", label: "High Signal" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search builders, tickers, projects..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(""); setQ(""); }} className="px-3 py-2.5 text-white/40 hover:text-white/70 border border-white/10 rounded-xl text-sm transition-colors">✕</button>
          )}
        </form>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="px-4 py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-black font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {scanning ? (
              <><span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />Scanning...</>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                Scan X
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scan result flash */}
      {scanResult && (
        <div className="mb-4 flex items-center gap-2 text-sm text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          {scanResult}
          <button onClick={() => setScanResult(null)} className="ml-auto text-white/30 hover:text-white/60">✕</button>
        </div>
      )}

      {/* Scan error */}
      {scanError && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              {scanError.setupRequired ? (
                <>
                  <p className="text-sm font-medium text-yellow-200 mb-1">X API setup required</p>
                  <p className="text-xs text-yellow-200/70 leading-relaxed">
                    Your developer app needs to be inside a Project.{" "}
                    <a href="https://developer.twitter.com/en/portal/projects-and-apps" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">
                      Go to developer.twitter.com
                    </a>{" "}
                    → create a Project → move your app into it → regenerate bearer token.
                  </p>
                </>
              ) : (
                <p className="text-sm text-yellow-200/80">{scanError.message}</p>
              )}
            </div>
            <button onClick={() => setScanError(null)} className="text-yellow-200/30 hover:text-yellow-200/70 shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === key ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}
          >
            {label}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto text-xs text-white/25">
            {filtered.length} of {total} shown
          </span>
        )}
      </div>

      {/* Empty state */}
      {!loading && opportunities.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>
          <p className="text-white/30 text-lg mb-1">No narratives yet</p>
          <p className="text-white/20 text-sm mb-6">Add your X API key and click Scan X to find builders</p>
          <button onClick={triggerScan} disabled={scanning} className="px-6 py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-black font-bold rounded-xl transition-colors">
            {scanning ? "Scanning..." : "Scan X Now"}
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      )}

      {/* Feed */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {/* Featured top card (full width) */}
          {top && page === 1 && filter === "all" && !q && (
            <NarrativeCard opportunity={top} featured />
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(page === 1 && filter === "all" && !q ? rest : filtered).map(opp => (
              <NarrativeCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-xl text-sm transition-colors">Previous</button>
          <span className="text-sm text-white/30">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-xl text-sm transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
