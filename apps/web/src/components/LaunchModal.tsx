"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { useNarraWallet } from "@/context/WalletContext";
import { shortenAddress, getOrCreateWallet, qrUrl } from "@/lib/clientWallet";
import type { OpportunityWithRelations } from "@bags-scout/shared";

const MIN_SOL = 0.05;

type Step = "edit" | "confirm" | "launching" | "done" | "error";

interface TokenDetails {
  tokenName: string;
  ticker: string;
  description: string;
  imageUrl: string;
  website: string;
  devBuySol: string;
}

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
  const { publicKey, balance, refresh } = useNarraWallet();

  const [step, setStep] = useState<Step>("edit");
  const [mintAddress, setMintAddress] = useState("");
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showImgInput, setShowImgInput] = useState(false);

  const [details, setDetails] = useState<TokenDetails>({
    tokenName: narrative?.tokenName ?? "",
    ticker: narrative?.ticker ?? "",
    description: narrative?.projectDesc ?? "",
    imageUrl: builder.profileImageUrl ?? "",
    website: "",
    devBuySol: "0",
  });

  useEffect(() => { refresh(); }, [refresh]);

  if (!narrative) return null;

  const devBuySol = Math.max(0, parseFloat(details.devBuySol) || 0);
  const totalNeeded = MIN_SOL + devBuySol;
  const needed = Math.max(0, totalNeeded - balance);
  const canAfford = balance >= totalNeeded;
  const shortAddr = publicKey ? shortenAddress(publicKey) : "";
  const pct = Math.min(100, (balance / Math.max(totalNeeded, 0.001)) * 100);

  function set(field: keyof TokenDetails, val: string) {
    setDetails(prev => ({ ...prev, [field]: val }));
  }

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
        body: JSON.stringify({
          opportunityId: opportunity.id,
          walletPublicKey: publicKey,
          tokenName: details.tokenName,
          ticker: details.ticker.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          description: details.description,
          imageUrl: details.imageUrl,
          website: details.website,
          devBuySol,
        }),
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
              <p className="font-semibold text-sm leading-tight">{builder.displayName}</p>
              <p className="text-xs text-white/35">@{builder.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step dots */}
        {(step === "edit" || step === "confirm") && (
          <div className="flex items-center justify-center gap-1.5 pb-4 shrink-0">
            {(["edit", "confirm"] as Step[]).map((s, i) => (
              <div key={s} className={`h-1 rounded-full transition-all ${step === s ? "w-6 bg-brand-400" : i < (step === "confirm" ? 1 : 0) ? "w-3 bg-brand-700" : "w-3 bg-white/10"}`} />
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">

          {/* EDIT */}
          {step === "edit" && (
            <div className="space-y-3">
              {/* Image + name + ticker */}
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={details.imageUrl || qrUrl(publicKey ?? "default")}
                    alt="Token"
                    className="w-16 h-16 rounded-2xl object-cover bg-white/5"
                  />
                  <button
                    onClick={() => setShowImgInput(v => !v)}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center"
                    title="Change image"
                  >
                    <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    value={details.tokenName}
                    onChange={e => set("tokenName", e.target.value.slice(0, 32))}
                    placeholder="Token name"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-500/50"
                  />
                  <input
                    value={details.ticker}
                    onChange={e => set("ticker", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                    placeholder="TICKER"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm font-mono font-bold text-brand-400 placeholder-white/25 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              </div>

              {/* Image URL input */}
              {showImgInput && (
                <input
                  value={details.imageUrl}
                  onChange={e => set("imageUrl", e.target.value)}
                  placeholder="https://... image URL"
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white/70 placeholder-white/25 focus:outline-none focus:border-brand-500/50"
                />
              )}

              {/* Description */}
              <textarea
                value={details.description}
                onChange={e => set("description", e.target.value.slice(0, 1000))}
                placeholder="Token description..."
                rows={3}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-brand-500/50 resize-none"
              />

              {/* Website */}
              <input
                value={details.website}
                onChange={e => set("website", e.target.value)}
                placeholder="Website (optional)"
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white/70 placeholder-white/25 focus:outline-none focus:border-brand-500/50"
              />

              {/* Dev buy */}
              <div className="bg-white/4 rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Dev buy</p>
                    <p className="text-xs text-white/35 mt-0.5">Buy tokens at launch (optional)</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={details.devBuySol}
                      onChange={e => set("devBuySol", e.target.value)}
                      className="w-20 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-sm text-right text-white font-mono focus:outline-none focus:border-brand-500/50"
                    />
                    <span className="text-xs text-white/40">SOL</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep("confirm")}
                disabled={!details.tokenName || !details.ticker}
                className="w-full py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-2xl transition-colors text-sm"
              >
                Continue →
              </button>
            </div>
          )}

          {/* CONFIRM */}
          {step === "confirm" && (
            <div className="space-y-3">
              {/* Token summary */}
              <div className="flex items-center gap-3 bg-white/4 rounded-2xl px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={details.imageUrl || qrUrl(publicKey ?? "default")} alt="Token" className="w-10 h-10 rounded-xl object-cover bg-white/5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-brand-400">${details.ticker}</p>
                  <p className="text-xs text-white/40 truncate">{details.tokenName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white/40">Fee share</p>
                  <p className="text-sm font-medium text-green-400">100% to you</p>
                </div>
              </div>

              {/* Dev buy summary */}
              {devBuySol > 0 && (
                <div className="flex items-center justify-between bg-white/4 rounded-2xl px-4 py-3">
                  <span className="text-sm text-white/60">Dev buy</span>
                  <span className="text-sm font-mono font-bold text-white">{devBuySol.toFixed(3)} SOL</span>
                </div>
              )}

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
                      <span className={`text-sm font-mono font-bold ${canAfford ? "text-green-400" : "text-yellow-400"}`}>
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
                    <div className={`h-full rounded-full transition-all ${canAfford ? "bg-green-400" : "bg-yellow-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-white/25 mt-1">
                    {canAfford
                      ? `${totalNeeded.toFixed(3)} SOL required ✓`
                      : `Need ${needed.toFixed(3)} more SOL`}
                  </p>
                </div>

                {/* Inline deposit QR when balance too low */}
                {!canAfford && publicKey && (
                  <div className="border-t border-white/6 pt-3">
                    <p className="text-xs text-white/40 mb-2">Deposit SOL to this address:</p>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrUrl(publicKey)} alt="QR" className="w-16 h-16 rounded-xl shrink-0" />
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-white/40 break-all leading-relaxed">{publicKey}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button onClick={() => setStep("edit")} className="flex-1 py-3 border border-white/8 rounded-2xl text-sm text-white/50 hover:text-white/80 hover:border-white/15 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={!canAfford}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-2xl transition-colors text-sm"
                >
                  {canAfford ? "Launch Token" : "Need SOL"}
                </button>
              </div>
            </div>
          )}

          {/* LAUNCHING */}
          {step === "launching" && (
            <div className="text-center py-14">
              <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-5" />
              <p className="font-semibold text-base">${details.ticker}</p>
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
              <p className="font-bold text-2xl font-mono text-brand-400 mb-1">${details.ticker}</p>
              <p className="text-sm text-white/50 mb-5">{details.tokenName} is live on Bags</p>
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
