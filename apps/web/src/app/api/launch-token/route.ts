import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";

export interface LaunchTokenRequest {
  opportunityId: string;
  devWalletPublicKey: string;
}

export interface LaunchTokenResponse {
  success: boolean;
  tokenMint?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as LaunchTokenRequest;

  if (!body.opportunityId || !body.devWalletPublicKey) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: body.opportunityId },
    include: { narrative: true, builder: true },
  });

  if (!opportunity?.narrative) {
    return NextResponse.json({ success: false, error: "Opportunity or narrative not found" }, { status: 404 });
  }

  const bagsBaseUrl = process.env.BAGS_BASE_URL ?? "http://localhost:3001";
  const bagsApiKey = process.env.BAGS_API_KEY;

  if (!bagsApiKey) {
    return NextResponse.json({ success: false, error: "Bags API key not configured" }, { status: 500 });
  }

  const bagsRes = await fetch(`${bagsBaseUrl}/api/create-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${bagsApiKey}`,
    },
    body: JSON.stringify({
      name: opportunity.narrative.tokenName,
      ticker: opportunity.narrative.ticker,
      description: opportunity.narrative.projectDesc,
      narrative: opportunity.narrative.launchNarrative,
      devWallet: body.devWalletPublicKey,
      twitter: opportunity.builder.username,
      type: "community_support",
    }),
  });

  if (!bagsRes.ok) {
    const text = await bagsRes.text().catch(() => bagsRes.statusText);
    return NextResponse.json({ success: false, error: `Bags API error: ${text}` }, { status: 502 });
  }

  const bagsData = await bagsRes.json();
  const tokenMint: string = bagsData.tokenMint ?? bagsData.mint ?? bagsData.address ?? bagsData.token;

  await prisma.opportunity.update({
    where: { id: body.opportunityId },
    data: { status: "LAUNCHED" },
  });

  return NextResponse.json({ success: true, tokenMint } satisfies LaunchTokenResponse);
}
