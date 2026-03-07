import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@bags-scout/db";
import { getHighScoreOpportunities } from "./scorer";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface NarrativeOutput {
  projectDesc: string;
  whyItMatters: string;
  tokenName: string;
  ticker: string;
  launchNarrative: string;
}

export async function generateNarrative(params: {
  displayName: string;
  username: string;
  bio: string | null;
  followerCount: number;
  postText: string;
  likeCount: number;
  retweetCount: number;
}): Promise<NarrativeOutput> {
  const prompt = `You are a narrative writer for Bags Scout, a builder discovery platform where communities can support developers and creators by launching tokens.

Given a builder's profile and post, generate a compelling launch narrative.

Builder: ${params.displayName} (@${params.username})
Bio: ${params.bio ?? "No bio provided"}
Followers: ${params.followerCount.toLocaleString()}
Post: ${params.postText}
Engagement: ${params.likeCount} likes, ${params.retweetCount} retweets

Generate a JSON object with these exact fields:
- projectDesc: 1-2 sentence description of what they're building (based on post content)
- whyItMatters: 1-2 sentences explaining why the community should care or support this builder
- tokenName: a 2-3 word token name that represents this builder or project (e.g. "Build Scout", "Indie Stack")
- ticker: a 3-5 character ticker symbol (uppercase, no spaces, e.g. "BSCOUT", "INDIE")
- launchNarrative: 2-3 sentences describing why this is a good community launch opportunity

Keep the tone authentic, builder-focused, and supportive. Avoid hype. Be specific to their actual work.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Claude response");

  const parsed = JSON.parse(jsonMatch[0]) as NarrativeOutput;

  // Validate required fields
  if (!parsed.projectDesc || !parsed.whyItMatters || !parsed.tokenName || !parsed.ticker || !parsed.launchNarrative) {
    throw new Error("Claude response missing required narrative fields");
  }

  // Normalize ticker
  parsed.ticker = parsed.ticker.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);

  return parsed;
}

export async function generatePendingNarratives(): Promise<number> {
  const opportunities = await getHighScoreOpportunities();
  let generated = 0;

  for (const opp of opportunities) {
    try {
      const narrative = await generateNarrative({
        displayName: opp.builder.displayName,
        username: opp.builder.username,
        bio: opp.builder.bio,
        followerCount: opp.builder.followerCount,
        postText: opp.post.text,
        likeCount: opp.post.likeCount,
        retweetCount: opp.post.retweetCount,
      });

      await prisma.$transaction([
        prisma.narrative.create({
          data: {
            opportunityId: opp.id,
            projectDesc: narrative.projectDesc,
            whyItMatters: narrative.whyItMatters,
            tokenName: narrative.tokenName,
            ticker: narrative.ticker,
            launchNarrative: narrative.launchNarrative,
          },
        }),
        prisma.opportunity.update({
          where: { id: opp.id },
          data: { status: "NARRATED" },
        }),
      ]);

      generated++;
    } catch (err) {
      console.error(`Narrative generation failed for opportunity ${opp.id}:`, err);
    }
  }

  return generated;
}
