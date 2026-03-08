"use client";

import { useState } from "react";
import Image from "next/image";
import { useNarraWallet } from "@/context/WalletContext";

export function WalletOnboarding() {
  const { needsOnboarding, createWallet } = useNarraWallet();
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [xHandle, setXHandleInput] = useState("");

  if (!needsOnboarding) return null;

  async function handleCreate() {
    setCreating(true);
    await createWallet(xHandle || undefined);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-sm bg-[#0e0e0e] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ animation: "onboard-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <style>{`
          @keyframes onboard-in {
            from { opacity: 0; transform: scale(0.88) translateY(16px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Top gradient stripe */}
        <div className="h-1 bg-gradient-to-r from-green-500/60 via-brand-500/60 to-purple-500/60" />

        <div className="p-7">
          {/* Logo + heading */}
          <div className="flex items-center gap-3 mb-6">
            <Image src="/narra-logo.png" alt="Narra" width={36} height={36} className="rounded-xl" />
            <div>
              <p className="font-bold text-base tracking-tight">Welcome to Narra</p>
              <p className="text-xs text-white/35">Your personal Solana wallet</p>
            </div>
          </div>

          {/* Explainer */}
          <div className="space-y-3 mb-7">
            <Row icon="🔑" title="Yours only" desc="Your wallet lives in your browser. No one else can see or access it." />
            <Row icon="⚡" title="Ready to launch" desc="Fund it with SOL to back builders and launch community tokens." />
            <Row icon="💾" title="Export anytime" desc="Back it up from the wallet menu whenever you want." />
          </div>

          {/* X handle input */}
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-white/25 transition-colors">
              <svg className="w-3.5 h-3.5 text-white/30 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-white/30 text-sm">@</span>
              <input
                type="text"
                placeholder="yourhandle (optional)"
                value={xHandle}
                onChange={e => setXHandleInput(e.target.value.replace(/^@/, ""))}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
              />
            </div>
            <p className="text-[10px] text-white/20 mt-1.5 px-1">Helps us identify who launches tokens</p>
          </div>

          {/* CTA */}
          {done ? (
            <div className="text-center py-2">
              <p className="text-green-400 font-semibold text-sm">Wallet created ✓</p>
            </div>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-black font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {creating ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating wallet...
                </>
              ) : (
                "Create my wallet"
              )}
            </button>
          )}

          <p className="text-center text-[11px] text-white/20 mt-3">
            No sign-up. No email. Just yours.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
