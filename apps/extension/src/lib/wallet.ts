import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

const RPC = "https://api.mainnet-beta.solana.com";
const BASE = "http://localhost:3001";
const connection = new Connection(RPC, "confirmed");

export const MIN_LAUNCH_SOL = 0.05;

export interface WalletInfo {
  publicKey: string;
  balanceSol: number;
  canLaunch: boolean;
}

/** Public key registered by the web app — single source of truth */
async function getBackendPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/wallet`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.publicKey ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns wallet info from the backend (same wallet as web app).
 * Returns null if web app hasn't set up a wallet yet.
 */
export async function getWalletInfo(): Promise<WalletInfo | null> {
  const publicKey = await getBackendPublicKey();
  if (!publicKey) return null;

  try {
    const lamports = await connection.getBalance(new PublicKey(publicKey));
    const balanceSol = lamports / LAMPORTS_PER_SOL;
    return { publicKey, balanceSol, canLaunch: balanceSol >= MIN_LAUNCH_SOL };
  } catch {
    return { publicKey, balanceSol: 0, canLaunch: false };
  }
}

/**
 * Returns the locally stored private key if one exists from before the sync
 * migration. Used to help users migrate their old extension wallet to the web app.
 */
export async function getLegacyPrivateKey(): Promise<string | null> {
  const stored = await chrome.storage.local.get("narraDevWallet");
  return (stored.narraDevWallet as string) ?? null;
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function qrUrl(address: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&bgcolor=111111&color=4ade80&data=${address}`;
}
