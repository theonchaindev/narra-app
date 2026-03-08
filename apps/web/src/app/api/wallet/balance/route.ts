import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
];

export async function GET(req: NextRequest) {
  const pubkey = req.nextUrl.searchParams.get("pubkey");
  if (!pubkey) {
    return NextResponse.json({ error: "pubkey required" }, { status: 400 });
  }

  let pk: PublicKey;
  try {
    pk = new PublicKey(pubkey);
  } catch {
    return NextResponse.json({ error: "invalid pubkey" }, { status: 400 });
  }

  for (const rpc of RPCS) {
    try {
      const connection = new Connection(rpc, "confirmed");
      const lamports = await connection.getBalance(pk);
      return NextResponse.json({ balance: lamports / LAMPORTS_PER_SOL });
    } catch {
      // try next RPC
    }
  }

  return NextResponse.json({ error: "Failed to fetch balance" }, { status: 502 });
}
