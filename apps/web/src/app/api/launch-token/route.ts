import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";

const BAGS_API = "https://public-api-v2.bags.fm/api/v1";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    opportunityId,
    walletPublicKey,
    tokenName: customName,
    ticker: customTicker,
    description: customDesc,
    imageUrl: customImageUrl,
    website,
    devBuySol,
  } = body;

  if (!opportunityId || !walletPublicKey) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { narrative: true, builder: true },
  });

  if (!opportunity?.narrative) {
    return NextResponse.json({ success: false, error: "Opportunity not found" }, { status: 404 });
  }

  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "Bags API key not configured" }, { status: 500 });
  }

  const { narrative, builder } = opportunity;
  const authHeaders = { "x-api-key": apiKey };

  // Resolve token details — prefer user-provided overrides
  const name = (customName || narrative.tokenName).slice(0, 32);
  const symbol = (customTicker || narrative.ticker).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const description = (customDesc || narrative.projectDesc).slice(0, 1000);
  const imageUrl = customImageUrl || builder.profileImageUrl || "";
  const initialBuyLamports = Math.round(Math.max(0, parseFloat(devBuySol) || 0) * 1_000_000_000);

  // Step 1: Create token info + metadata on IPFS
  const formData = new FormData();
  formData.append("name", name);
  formData.append("symbol", symbol);
  formData.append("description", description);
  formData.append("twitter", `https://x.com/${builder.username}`);
  if (website) formData.append("website", website);
  if (imageUrl) formData.append("imageUrl", imageUrl);

  const tokenInfoRes = await fetch(`${BAGS_API}/token-launch/create-token-info`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });

  if (!tokenInfoRes.ok) {
    const err = await tokenInfoRes.text().catch(() => tokenInfoRes.statusText);
    return NextResponse.json({ success: false, error: `Token info error: ${err}` }, { status: 502 });
  }

  const tokenInfoData = await tokenInfoRes.json();
  const tokenMint: string = tokenInfoData.response.tokenMint;
  const ipfs: string = tokenInfoData.response.tokenMetadata;

  // Step 2: Create fee share config (launcher gets 100% of fees)
  const feeConfigRes = await fetch(`${BAGS_API}/fee-share/config`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      payer: walletPublicKey,
      baseMint: tokenMint,
      claimersArray: [walletPublicKey],
      basisPointsArray: [10000],
    }),
  });

  if (!feeConfigRes.ok) {
    const err = await feeConfigRes.text().catch(() => feeConfigRes.statusText);
    return NextResponse.json({ success: false, error: `Fee config error: ${err}` }, { status: 502 });
  }

  const feeConfigData = await feeConfigRes.json();
  const feeResponse = feeConfigData.response ?? feeConfigData;
  const configKey: string = feeResponse.meteoraConfigKey;
  const setupTransactions: string[] = feeResponse.needsCreation
    ? (feeResponse.transactions ?? [])
    : [];

  // Step 3: Create the launch transaction (to be signed client-side)
  const launchTxRes = await fetch(`${BAGS_API}/token-launch/create-launch-transaction`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      ipfs,
      tokenMint,
      wallet: walletPublicKey,
      initialBuyLamports,
      configKey,
    }),
  });

  if (!launchTxRes.ok) {
    const err = await launchTxRes.text().catch(() => launchTxRes.statusText);
    return NextResponse.json({ success: false, error: `Launch tx error: ${err}` }, { status: 502 });
  }

  const launchTxData = await launchTxRes.json();
  const launchTransaction: string = launchTxData.response;

  return NextResponse.json({
    success: true,
    tokenMint,
    setupTransactions,
    launchTransaction,
  });
}
