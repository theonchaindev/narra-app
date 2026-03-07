import type { Narrative, Builder } from "@bags-scout/shared";

export function buildBagsLaunchUrl(narrative: Narrative, builder: Builder): string {
  const base = process.env.BAGS_BASE_URL ?? "http://localhost:3001";
  const params = new URLSearchParams({
    name: narrative.tokenName,
    ticker: narrative.ticker,
    description: narrative.projectDesc,
    narrative: narrative.launchNarrative,
    twitter: builder.username,
    type: "community_support",
  });
  return `${base}/launch?${params.toString()}`;
}
