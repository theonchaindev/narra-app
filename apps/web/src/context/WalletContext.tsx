"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getOrCreateWallet,
  getPrivateKey,
  getStoredSecretKey,
  importWallet,
  clearWallet,
  sendSol,
  setXHandle,
  MIN_LAUNCH_SOL,
} from "@/lib/clientWallet";

async function fetchBalance(publicKey: string): Promise<number> {
  try {
    const res = await fetch(`/api/wallet/balance?pubkey=${publicKey}`);
    if (!res.ok) return 0;
    const data = await res.json() as { balance?: number };
    return data.balance ?? 0;
  } catch {
    return 0;
  }
}

interface WalletState {
  publicKey: string | null;
  balance: number;
  canLaunch: boolean;
  loading: boolean;
  needsOnboarding: boolean;
  createWallet: (xHandle?: string) => Promise<void>;
  walletOpen: boolean;
  openWallet: () => void;
  closeWallet: () => void;
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
  needsOnboarding: false,
  createWallet: async (_xHandle?: string) => {},
  walletOpen: false,
  openWallet: () => {},
  closeWallet: () => {},
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
  const [walletOpen, setWalletOpen] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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

    const bal = await fetchBalance(pubkey);
    setBalance(bal);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    const bal = await fetchBalance(publicKey);
    setBalance(bal);
  }, [publicKey]);

  const exportPrivateKey = useCallback(() => getPrivateKey(), []);

  const importKey = useCallback(async (sk: string) => {
    importWallet(sk);
    await init();
  }, [init]);

  const reset = useCallback(async () => {
    clearWallet();
    await init();
  }, [init]);

  const withdraw = useCallback(async (toAddress: string, amountSol: number) => {
    const sig = await sendSol(toAddress, amountSol);
    if (publicKey) {
      const bal = await fetchBalance(publicKey);
      setBalance(bal);
    }
    return sig;
  }, [publicKey]);

  const createWallet = useCallback(async (xHandle?: string) => {
    if (xHandle) setXHandle(xHandle);
    setNeedsOnboarding(false);
    await init();
  }, [init]);

  const openWallet = useCallback(() => setWalletOpen(true), []);
  const closeWallet = useCallback(() => setWalletOpen(false), []);

  useEffect(() => {
    // Check before creating — if no key stored, show onboarding first
    if (getStoredSecretKey()) {
      init();
    } else {
      setNeedsOnboarding(true);
      setLoading(false);
    }
  }, [init]);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = walletOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [walletOpen]);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        balance,
        canLaunch: balance >= MIN_LAUNCH_SOL,
        loading,
        needsOnboarding,
        createWallet,
        walletOpen,
        openWallet,
        closeWallet,
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
