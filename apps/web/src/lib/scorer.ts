import { prisma } from "@bags-scout/db";
import { BUILDER_KEYWORDS, MIN_SCORE_FOR_NARRATIVE } from "@bags-scout/shared";
import type { ScoreBreakdown } from "@bags-scout/shared";

function scoreEngagement(likeCount: number, retweetCount: number, followerCount: number): number {
  if (followerCount === 0) return 0;
  const rate = (likeCount + retweetCount * 2) / followerCount;
  // Cap at 30 points: rate >= 0.05 = 30pts, 0.01 = 15pts, 0.001 = 5pts
  if (rate >= 0.05) return 30;
  if (rate >= 0.02) return 22;
  if (rate >= 0.01) return 15;
  if (rate >= 0.005) return 10;
  if (rate >= 0.001) return 5;
  return 2;
}

function scoreFollowerTier(followerCount: number): number {
  if (followerCount >= 100_000) return 20;
  if (followerCount >= 10_000) return 15;
  if (followerCount >= 1_000) return 10;
  if (followerCount >= 500) return 6;
  if (followerCount >= 100) return 3;
  return 0;
}

function scoreKeywords(text: string): number {
  const lower = text.toLowerCase();
  const matched = BUILDER_KEYWORDS.filter((kw) => lower.includes(kw));
  // Up to 20 points: 1 match = 8, 2 = 14, 3+ = 20
  if (matched.length >= 3) return 20;
  if (matched.length === 2) return 14;
  if (matched.length === 1) return 8;
  return 0;
}

function scoreMedia(hasMedia: boolean, hasDemoLink: boolean): number {
  return (hasMedia ? 10 : 0) + (hasDemoLink ? 5 : 0);
}

function scoreGithub(hasGithubLink: boolean): number {
  return hasGithubLink ? 10 : 0;
}

function scoreReplies(replyCount: number): number {
  return replyCount >= 5 ? 5 : 0;
}

export interface PostScore {
  total: number;
  breakdown: ScoreBreakdown;
}

export function scorePost(
  post: {
    text: string;
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    hasMedia: boolean;
    hasGithubLink: boolean;
    hasDemoLink: boolean;
  },
  followerCount: number
): PostScore {
  const engagement = scoreEngagement(post.likeCount, post.retweetCount, followerCount);
  const followerTier = scoreFollowerTier(followerCount);
  const keywords = scoreKeywords(post.text);
  const media = scoreMedia(post.hasMedia, post.hasDemoLink);
  const github = scoreGithub(post.hasGithubLink);
  const replies = scoreReplies(post.replyCount);

  const total = Math.min(100, engagement + followerTier + keywords + media + github + replies);

  return {
    total,
    breakdown: { engagement, followerTier, keywords, media, github, replies },
  };
}

export async function scorePendingPosts(): Promise<number> {
  const posts = await prisma.post.findMany({
    where: { opportunity: null },
    include: { builder: true },
  });

  let scored = 0;

  for (const post of posts) {
    const { total, breakdown } = scorePost(post, post.builder.followerCount);

    await prisma.opportunity.create({
      data: {
        builderId: post.builderId,
        postId: post.id,
        score: total,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scoreBreakdown: breakdown as unknown as any,
        status: "SCORED",
      },
    });

    scored++;
  }

  return scored;
}

export async function getHighScoreOpportunities(minScore = MIN_SCORE_FOR_NARRATIVE) {
  const opps = await prisma.opportunity.findMany({
    where: {
      score: { gte: minScore },
      status: "SCORED",
    },
    include: { builder: true, post: true, narrative: true },
    orderBy: { score: "desc" },
  });
  // Filter out any that already have a narrative (workaround for Prisma v6 null relation filter)
  return opps.filter(o => !o.narrative);
}
