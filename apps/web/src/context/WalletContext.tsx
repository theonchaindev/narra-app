"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getOrCreateWallet,
  getBalance,
  getPrivateKey,
  importWallet,
  clearWallet,
  sendSol,
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
  withdraw: (toAddress: string, amountSol: number) => Promise<string>;
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
  withdraw: async () => "",
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

    try {
      await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pubkey }),
      });
    } catch {
      // Non-fatal
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

  const withdraw = useCallback(async (toAddress: string, amountSol: number) => {
    const sig = await sendSol(toAddress, amountSol);
    if (publicKey) {
      const bal = await getBalance(publicKey);
      setBalance(bal);
    }
    return sig;
  }, [publicKey]);

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
        withdraw,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useNarraWallet = () => useContext(WalletContext);
