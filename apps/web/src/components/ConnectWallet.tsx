"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function ConnectWallet() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const addr = publicKey.toBase58();
    const short = `${addr.slice(0, 4)}…${addr.slice(-4)}`;
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-white/10 hover:border-white/20 rounded-xl transition-colors"
        title={addr}
      >
        <span className="w-2 h-2 rounded-full bg-brand-400" />
        <span className="font-mono text-white/70">{short}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded-xl transition-colors text-white/80"
    >
      Connect Wallet
    </button>
  );
}
