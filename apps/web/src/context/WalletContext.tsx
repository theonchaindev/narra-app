"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getOrCreateWallet,
  getBalance,
  getPrivateKey,
  importWallet,
  clearWallet,
  MIN_LAUNCH_SOL,
} from "@/lib/clientWallet";

interface WalletState {
  publicKey: string | null;
  balance: number;
  canLaunch: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  exportPrivateKey: () => string | null;
  importKey: (sk: string) => Promise<void>;
  reset: () => Promise<void>;
}

const WalletContext = createContext<WalletState>({
  publicKey: null,
  balance: 0,
  canLaunch: false,
  loading: true,
  refresh: async () => {},
  exportPrivateKey: () => null,
  importKey: async () => {},
  reset: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const init = useCallback(async () => {
    setLoading(true);
    const keypair = getOrCreateWallet();
    const pubkey = keypair.publicKey.toBase58();
    setPublicKey(pubkey);

    // Sync public key to backend so extension can read it
    try {
      await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pubkey }),
      });
    } catch {
      // Non-fatal: backend sync failure
    }

    const bal = await getBalance(pubkey);
    setBalance(bal);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    const bal = await getBalance(publicKey);
    setBalance(bal);
  }, [publicKey]);

  const exportPrivateKey = useCallback(() => getPrivateKey(), []);

  const importKey = useCallback(
    async (sk: string) => {
      importWallet(sk);
      await init();
    },
    [init]
  );

  const reset = useCallback(async () => {
    clearWallet();
    await init();
  }, [init]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        balance,
        canLaunch: balance >= MIN_LAUNCH_SOL,
        loading,
        refresh,
        exportPrivateKey,
        importKey,
        reset,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useNarraWallet = () => useContext(WalletContext);
