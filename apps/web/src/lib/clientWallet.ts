import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

const STORAGE_KEY = "narraWallet";
const RPC = "https://api.mainnet-beta.solana.com";

export const MIN_LAUNCH_SOL = 0.05;

export function getStoredSecretKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function getOrCreateWallet(): Keypair {
  const stored = getStoredSecretKey();
  if (stored) {
    return Keypair.fromSecretKey(bs58.decode(stored));
  }
  const keypair = Keypair.generate();
  localStorage.setItem(STORAGE_KEY, bs58.encode(Buffer.from(keypair.secretKey)));
  return keypair;
}

export function importWallet(secretKeyBase58: string): Keypair {
  const secretKey = bs58.decode(secretKeyBase58);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  localStorage.setItem(STORAGE_KEY, secretKeyBase58);
  return keypair;
}

export function clearWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getPrivateKey(): string | null {
  return getStoredSecretKey();
}

export async function getBalance(publicKey: string): Promise<number> {
  try {
    const connection = new Connection(RPC, "confirmed");
    const lamports = await connection.getBalance(new PublicKey(publicKey));
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function qrUrl(address: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=0a0a0a&color=4ade80&data=${address}`;
}
