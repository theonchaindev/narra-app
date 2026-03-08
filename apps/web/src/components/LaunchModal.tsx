"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { useNarraWallet } from "@/context/WalletContext";
import { shortenAddress, getOrCreateWallet, qrUrl } from "@/lib/clientWallet";
import type { OpportunityWithRelations } from "@bags-scout/shared";

const MIN_SOL = 0.05;

type Step = "review" | "confirm" | "launching" | "done" | "error";

function signTx(base58Tx: string): string {
  const keypair = getOrCreateWallet();
  const txBytes = bs58.decode(base58Tx);
  try {
    const tx = VersionedTransaction.deserialize(txBytes);
    tx.sign([keypair]);
    return bs58.encode(tx.serialize());
  } catch {
    const tx = Transaction.from(txBytes);
    tx.partialSign(keypair);
    return bs58.encode(tx.serialize({ requireAllSignatures: false }));
  }
}

export function LaunchModal({ opportunity, onClose }: { opportunity: OpportunityWithRelations; onClose: () => void }) {
  const { narrative, builder } = opportunity;
  const { publicKey, balance, canLaunch, refresh } = useNarraWallet();

  const [step, setStep] = useState<Step>("review");
  const [mintAddress, setMintAddress] = useState("");
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);

  if (!narrative) return null;

  const needed = Math.max(0, MIN_SOL - balance);
  const shortAddr = publicKey ? shortenAddress(publicKey) : "";
  const pct = Math.min(100, (balance / MIN_SOL) * 100);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleLaunch() {
    if (!publicKey) return;
    setStep("launching");
    setStatusMsg("Preparing token...");
    try {
      const res = await fetch("/api/launch-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id, walletPublicKey: publicKey }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Preparation failed"); setStep("error"); return; }

      const { tokenMint, setupTransactions, launchTransaction } = data as {
        tokenMint: string; setupTransactions: string[]; launchTransaction: string;
      };

      for (let i = 0; i < setupTransactions.length; i++) {
        setStatusMsg(`Fee config (${i + 1}/${setupTransactions.length})...`);
        const sendRes = await fetch("/api/launch-token/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction: signTx(setupTransactions[i]) }),
        });
        const sendData = await sendRes.json();
        if (!sendData.success) { setError(sendData.error ?? "Setup failed"); setStep("error"); return; }
      }

      setStatusMsg("Broadcasting to Solana...");
      const launchRes = await fetch("/api/launch-token/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: signTx(launchTransaction), opportunityId: opportunity.id }),
      });
      const launchData = await launchRes.json();
      if (!launchData.success) { setError(launchData.error ?? "Launch failed"); setStep("error"); return; }

      setMintAddress(tokenMint);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Launch failed");
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0e0e0e] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl shadow-black/60 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            {builder.profileImageUrl && (
              <Image src={builder.profileImageUrl} alt={builder.displayName} width={32} height={32} className="rounded-full ring-1 ring-white/10" />
            )}
            <div>
              <p className="font-semibold text-sm leading-tight">{narrative.tokenName}</p>
              <p className="text-xs text-white/35">@{builder.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-brand-400">${narrative.ticker}</span>
            <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step dots */}
        {step === "review" || step === "confirm" ? (
          <div className="flex items-center justify-center gap-1.5 pb-4 shrink-0">
            {(["review", "confirm"] as Step[]).map((s, i) => (
              <div key={s} className={`h-1 rounded-full transition-all ${step === s ? "w-6 bg-brand-400" : i < (step === "confirm" ? 1 : 0) ? "w-3 bg-brand-700" : "w-3 bg-white/10"}`} />
            ))}
          </div>
        ) : null}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">

          {/* REVIEW */}
          {step === "review" && (
            <div className="space-y-4">
              {/* Narrative */}
              <div className="bg-white/4 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Project</p>
                <p className="text-sm text-white/80 leading-relaxed">{narrative.projectDesc}</p>
                <div className="border-t border-white/6 pt-3">
                  <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-1.5">Why it matters</p>
                  <p className="text-sm text-white/60 leading-relaxed">{narrative.whyItMatters}</p>
                </div>
                <div className="border-t border-white/6 pt-3">
                  <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-1.5">Launch narrative</p>
                  <p className="text-sm text-white/60 leading-relaxed">{narrative.launchNarrative}</p>
                </div>
              </div>

              <p className="text-[11px] text-white/20 text-center">Community support launch · creator not verified</p>

              <button
                onClick={() => setStep("confirm")}
                className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-2xl transition-colors text-sm"
              >
                Continue to Launch →
              </button>
            </div>
          )}

          {/* CONFIRM */}
          {step === "confirm" && (
            <div className="space-y-3">
              {/* Token summary */}
              <div className="flex items-center justify-between bg-white/4 rounded-2xl px-4 py-3">
                <div>
                  <p className="font-mono font-bold text-brand-400">${narrative.ticker}</p>
                  <p className="text-xs text-white/40">{narrative.tokenName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">Fee share</p>
                  <p className="text-sm font-medium text-green-400">100% to you</p>
                </div>
              </div>

              {/* Wallet + balance */}
              <div className="bg-white/4 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Wallet</span>
                  <span className="font-mono text-xs text-white/60">{shortAddr}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/40">Balance</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-bold ${canLaunch ? "text-green-400" : "text-yellow-400"}`}>
                        {balance.toFixed(4)} SOL
                      </span>
                      <button onClick={handleRefresh} disabled={refreshing} className="text-white/20 hover:text-white/50 transition-colors">
                        <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${canLaunch ? "bg-green-400" : "bg-yellow-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-white/25 mt-1">
                    {canLaunch ? `Min. ${MIN_SOL} SOL reached ✓` : `Need ${needed.toFixed(3)} more SOL to launch`}
                  </p>
                </div>

                {/* Inline deposit QR when balance too low */}
                {!canLaunch && publicKey && (
                  <div className="border-t border-white/6 pt-3">
                    <p className="text-xs text-white/40 mb-2">Deposit SOL to this address:</p>
                    <div className="flex items-center gap-3">
                      <img src={qrUrl(publicKey)} alt="QR" className="w-16 h-16 rounded-xl shrink-0" />
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-white/40 break-all leading-relaxed">{publicKey}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button onClick={() => setStep("review")} className="flex-1 py-3 border border-white/8 rounded-2xl text-sm text-white/50 hover:text-white/80 hover:border-white/15 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={!canLaunch}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-2xl transition-colors text-sm"
                >
                  {canLaunch ? "Launch Token" : "Need SOL"}
                </button>
              </div>
            </div>
          )}

          {/* LAUNCHING */}
          {step === "launching" && (
            <div className="text-center py-14">
              <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-5" />
              <p className="font-semibold text-base">${narrative.ticker}</p>
              <p className="text-sm text-white/40 mt-1.5">{statusMsg}</p>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-2xl font-mono text-brand-400 mb-1">${narrative.ticker}</p>
              <p className="text-sm text-white/50 mb-5">{narrative.tokenName} is live on Bags</p>
              {mintAddress && (
                <a
                  href={`https://bags.fm/token/${mintAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs text-brand-400/60 hover:text-brand-400 font-mono bg-white/4 rounded-xl px-3 py-2.5 mb-5 transition-colors"
                >
                  View on Bags →
                </a>
              )}
              <button onClick={onClose} className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-2xl transition-colors text-sm">
                Done
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-semibold text-red-400 mb-2">Launch failed</p>
              <p className="text-sm text-white/35 mb-6 leading-relaxed">{error}</p>
              <button onClick={() => setStep("confirm")} className="w-full py-3 border border-white/10 rounded-2xl text-sm text-white/60 hover:text-white/80 transition-colors">
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
