import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";

const BAGS_API = "https://public-api-v2.bags.fm/api/v1";

export async function POST(req: NextRequest) {
  const { transaction, opportunityId } = await req.json();

  if (!transaction) {
    return NextResponse.json({ success: false, error: "Missing transaction" }, { status: 400 });
  }

  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "API key not configured" }, { status: 500 });
  }

  const res = await fetch(`${BAGS_API}/solana/send-transaction`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transaction }),
  });

  const data = await res.json();

  // If this was the final launch transaction and it succeeded, mark as launched
  if (res.ok && data.success && opportunityId) {
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: "LAUNCHED" },
    }).catch(() => {}); // non-fatal
  }

  return NextResponse.json(data);
}
