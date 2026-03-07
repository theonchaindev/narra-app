"use client";

import Link from "next/link";
import { useNarraWallet } from "@/context/WalletContext";
import { shortenAddress } from "@/lib/clientWallet";

export function NarraWalletChip() {
  const { publicKey, balance, loading } = useNarraWallet();

  if (loading || !publicKey) {
    return (
      <div className="w-28 h-8 bg-white/5 rounded-xl animate-pulse" />
    );
  }

  return (
    <Link
      href="/wallet"
      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-white/10 hover:border-white/20 rounded-xl transition-colors"
      title={publicKey}
    >
      <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
      <span className="font-mono text-white/70">{shortenAddress(publicKey)}</span>
      <span className="text-white/35 text-xs">{balance.toFixed(3)}</span>
    </Link>
  );
}
