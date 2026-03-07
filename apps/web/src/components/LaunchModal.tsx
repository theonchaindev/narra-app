"use client";

import { useState, useEffect, useCallback } from "react";
import { useNarraWallet } from "@/context/WalletContext";
import { shortenAddress } from "@/lib/clientWallet";
import type { OpportunityWithRelations } from "@bags-scout/shared";

const MIN_SOL = 0.05;

type Step = "review" | "balance" | "confirm" | "launching" | "done" | "error";

export function LaunchModal({ opportunity, onClose }: { opportunity: OpportunityWithRelations; onClose: () => void }) {
  const { narrative, builder } = opportunity;
  const { publicKey, balance, canLaunch, refresh } = useNarraWallet();

  const [step, setStep] = useState<Step>("review");
  const [mintAddress, setMintAddress] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Refresh balance when modal opens
  useEffect(() => { refresh(); }, [refresh]);

  if (!narrative) return null;

  const needed = Math.max(0, MIN_SOL - balance);
  const shortAddr = publicKey ? shortenAddress(publicKey) : "";
  const STEPS: Step[] = ["review", "balance", "confirm"];

  async function handleRefreshBalance() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleLaunch() {
    if (!publicKey) return;
    setStep("launching");
    try {
      const res = await fetch("/api/launch-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id, devWalletPublicKey: publicKey }),
      });
      const data = await res.json();
      if (data.success) {
        setMintAddress(data.tokenMint ?? "");
        setStep("done");
      } else {
        setError(data.error ?? "Launch failed");
        setStep("error");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Launch failed");
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-semibold">Launch via Bags</h2>
            <p className="text-xs text-white/40 mt-0.5">Community Support Launch</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        {!["launching", "done", "error"].includes(step) && (
          <div className="flex border-b border-white/10">
            {STEPS.map((s, i) => {
              const curIdx = STEPS.indexOf(step);
              const done = i < curIdx;
              const active = i === curIdx;
              return (
                <div key={s} className="flex-1 py-2 text-center">
                  <span className={`text-xs font-medium ${active ? "text-brand-400" : done ? "text-brand-700" : "text-white/20"}`}>
                    {done ? "✓" : `${i + 1}`}. {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* REVIEW */}
          {step === "review" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Box label="Token name"><span className="font-semibold">{narrative.tokenName}</span></Box>
                <Box label="Ticker"><span className="font-mono font-bold text-brand-400">${narrative.ticker}</span></Box>
              </div>
              <Box label="Builder">
                <span className="text-sm text-white/70">@{builder.username} · {builder.followerCount.toLocaleString()} followers</span>
              </Box>
              <Box label="Project description">
                <p className="text-sm text-white/70 leading-relaxed">{narrative.projectDesc}</p>
              </Box>
              <Box label="Why it matters">
                <p className="text-sm text-white/70 leading-relaxed">{narrative.whyItMatters}</p>
              </Box>
              <Box label="Launch narrative">
                <p className="text-sm text-white/70 leading-relaxed">{narrative.launchNarrative}</p>
              </Box>
              <p className="text-xs text-white/25 text-center">Community Support Launch — creator not verified</p>
              <button
                onClick={() => setStep("balance")}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl transition-colors"
              >
                Continue to Launch
              </button>
            </>
          )}

          {/* BALANCE */}
          {step === "balance" && (
            <>
              <Box label="Narra wallet">
                <span className="font-mono text-sm text-white/70">{shortAddr}</span>
              </Box>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">SOL Balance</span>
                  <button
                    onClick={handleRefreshBalance}
                    disabled={refreshing}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <p className="text-2xl font-bold font-mono mb-3">
                  {balance.toFixed(4)}<span className="text-sm text-white/40 ml-1.5">SOL</span>
                </p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${canLaunch ? "bg-brand-500" : "bg-yellow-500"}`}
                    style={{ width: `${Math.min(100, (balance / MIN_SOL) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-white/30 mt-1.5">
                  {canLaunch ? `Minimum ${MIN_SOL} SOL reached ✓` : `Need ${needed.toFixed(3)} more SOL`}
                </p>
              </div>
              {!canLaunch && (
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3 text-sm text-yellow-200/80">
                  Send <strong>{needed.toFixed(3)} SOL</strong> to your Narra wallet to cover launch fees.{" "}
                  <a href="/wallet" className="underline hover:text-yellow-200" target="_blank">View wallet →</a>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep("review")} className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm text-white/60 transition-colors">Back</button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={!canLaunch}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-black font-bold rounded-xl transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* CONFIRM */}
          {step === "confirm" && (
            <>
              <div className="bg-brand-500/10 border border-brand-500/25 rounded-xl p-4 space-y-2">
                <p className="text-xs text-brand-400/70 font-medium uppercase tracking-wider">Ready to launch</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-400 text-xl">${narrative.ticker}</span>
                  <span className="text-white/30">·</span>
                  <span className="font-semibold">{narrative.tokenName}</span>
                </div>
                <p className="text-sm text-white/60">{narrative.launchNarrative}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-white/40">Wallet</span>
                  <span className="font-mono text-white/70">{shortAddr}</span>
                </div>
                <div className="flex justify-between text-sm bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-white/40">Balance</span>
                  <span className="font-mono text-brand-400">{balance.toFixed(4)} SOL ✓</span>
                </div>
              </div>
              <p className="text-xs text-white/20 text-center">Community Support Launch — creator not verified</p>
              <div className="flex gap-3">
                <button onClick={() => setStep("balance")} className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm text-white/60">Back</button>
                <button onClick={handleLaunch} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl transition-colors">
                  Confirm &amp; Launch
                </button>
              </div>
            </>
          )}

          {/* LAUNCHING */}
          {step === "launching" && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold">Launching ${narrative.ticker}...</p>
              <p className="text-sm text-white/40 mt-1">Submitting to Bags</p>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
              <p className="font-bold text-xl text-brand-400">${narrative.ticker}</p>
              <p className="text-sm text-white/50 mb-4">{narrative.tokenName} launched successfully</p>
              {mintAddress && mintAddress !== "STUB_MINT_ADDRESS_REPLACE_WHEN_BAGS_LIVE" && (
                <p className="text-xs text-white/30 font-mono break-all bg-white/5 rounded-xl px-3 py-2 mb-4">{mintAddress}</p>
              )}
              <button onClick={onClose} className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl transition-colors">Done</button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="text-center py-8">
              <p className="text-red-400 font-semibold mb-2">Launch failed</p>
              <p className="text-sm text-white/40 mb-6">{error}</p>
              <button onClick={() => setStep("confirm")} className="w-full py-2.5 border border-white/10 rounded-xl text-sm text-white/60">Try again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <p className="text-xs text-white/35 mb-1.5">{label}</p>
      {children}
    </div>
  );
}
