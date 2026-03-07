const BASE = "https://bags-scout.vercel.app";

export interface ValidatedBuilder {
  valid: boolean;
  reason?: string;
  username: string;
  displayName: string;
  followerCount: number;
  bio: string;
  profileImageUrl: string;
  isBuilder: boolean;
  isCharitable: boolean;
}

export interface NarrativeData {
  tokenName: string;
  ticker: string;
  projectDesc: string;
  whyItMatters: string;
  launchNarrative: string;
}

export interface Opportunity {
  id: string;
  score: number;
  scoreBreakdown: Record<string, number>;
  status: string;
  createdAt: string;
  builder: {
    username: string;
    displayName: string;
    followerCount: number;
    profileImageUrl: string | null;
    bio: string | null;
  };
  post: {
    tweetId: string;
    text: string;
    likeCount: number;
    retweetCount: number;
    hasMedia: boolean;
    hasGithubLink: boolean;
    hasDemoLink: boolean;
  };
  narrative: NarrativeData | null;
}

export async function validateBuilder(username: string, text: string): Promise<ValidatedBuilder> {
  const params = new URLSearchParams({ username, text });
  const res = await fetch(`${BASE}/api/validate-builder?${params}`);
  return res.json();
}

export async function getTopOpportunities(limit = 20): Promise<Opportunity[]> {
  const res = await fetch(`${BASE}/api/opportunities?sort=score&min=30&page=1`);
  const data = await res.json();
  return (data.opportunities ?? []).slice(0, limit);
}

export async function triggerScan(): Promise<{ narrativesGenerated: number; newPosts: number }> {
  const res = await fetch(`${BASE}/api/scan`, { method: "POST" });
  return res.json();
}

export async function launchToken(opportunityId: string, devWalletPublicKey: string) {
  const res = await fetch(`${BASE}/api/launch-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opportunityId, devWalletPublicKey }),
  });
  return res.json();
}

export async function generateNarrativeForBuilder(username: string, text: string): Promise<Opportunity | null> {
  // Trigger a scan (which will pick up any queued posts) then search for this user
  await triggerScan().catch(() => null);
  const res = await fetch(`${BASE}/api/opportunities?q=${encodeURIComponent(username)}&sort=recent`);
  const data = await res.json();
  return data.opportunities?.[0] ?? null;
}
