import { NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";

// Real tweets from real builders — IDs link directly to live X posts
const REAL_BUILDERS = [
  {
    twitterId: "seed_001", username: "levelsio", displayName: "Pieter Levels",
    bio: "Making 12 startups in 12 months. Building in public. No VC, no team.", followerCount: 490000,
    followingCount: 1200, profileImageUrl: "https://unavatar.io/twitter/levelsio",
    posts: [{
      tweetId: "1837707857372106992",
      text: "✨ I hit a new $420,000/mo revenue record 🍀\n\nAt ~80% profit now:\n\n📸 Photo AI $161K/m\n📕 Make book $93K/m\n🌍 Nomads.com $61K/m\n🏡 Interior AI $43K/m\n🎁 levelsio.com $34K/m (merch + X)\n🛰 Remote OK $29K/m\n\nAll solo, no employees, no VC, no office",
      likeCount: 18400, retweetCount: 1900, replyCount: 890, hasMedia: true, hasGithubLink: false, hasDemoLink: false,
    }],
    narrative: { tokenName: "Levels Build", ticker: "LVLS", projectDesc: "Pieter Levels runs 6 profitable products solo at $420K/month revenue — no employees, no VC, no office. The ultimate proof that one person can build an empire.", whyItMatters: "Pieter represents the most extreme version of indie success. $420K/month, 80% profit margin, built alone. A community token lets believers ride alongside the most followed solo builder on the internet.", launchNarrative: "LVLS is a community signal for the build-in-public movement. Pieter Levels has proven that one developer with the right ideas can outperform entire VC-backed teams. Back the builder, not the corporation." },
    score: 92,
  },
  {
    twitterId: "seed_002", username: "dannypostmaa", displayName: "Danny Postma",
    bio: "Building AI tools. Headpix, AISEOtools and more. $1M+ revenue solo.", followerCount: 78000,
    followingCount: 450, profileImageUrl: "https://unavatar.io/twitter/dannypostmaa",
    posts: [{
      tweetId: "1636337910017556480",
      text: "These headshots? Made entirely by AI. 😎\n\nIntroducing HeadshotPro: professional headshots for remote teams (or yourself).\n\nGet studio-quality photos without leaving home.\n\nDetails in the next tweets ↓",
      likeCount: 4100, retweetCount: 920, replyCount: 340, hasMedia: true, hasGithubLink: false, hasDemoLink: true,
    }],
    narrative: { tokenName: "PostBuild", ticker: "POST", projectDesc: "Danny Postma launched HeadshotPro — an AI headshot generator that went on to make $300K/month. Built in a weekend, profitable immediately, zero team.", whyItMatters: "Danny proves AI wrapper businesses can generate life-changing revenue with minimal code and no team. HeadshotPro became one of the fastest-growing AI tools of 2023.", launchNarrative: "POST is for builders who believe in fast AI products that make real money. Danny built HeadshotPro over a weekend and it reached $300K/month. The community can back the next one." },
    score: 88,
  },
  {
    twitterId: "seed_003", username: "t3dotgg", displayName: "Theo",
    bio: "CEO of t3.gg. Teaching full-stack TypeScript. Building in public.", followerCount: 210000,
    followingCount: 620, profileImageUrl: "https://unavatar.io/twitter/t3dotgg",
    posts: [{
      tweetId: "1834733326835630305",
      text: "This took us 6 months, and I'm so proud.\n\nUploadThing V7 is the best way to upload files on the web.\n\nFull rewrite. New infra. Crazy DX improvements.\n\nGo try it",
      likeCount: 2900, retweetCount: 740, replyCount: 180, hasMedia: false, hasGithubLink: true, hasDemoLink: true,
    }],
    narrative: { tokenName: "T3 Stack Token", ticker: "T3", projectDesc: "Theo ships production-grade TypeScript infrastructure used by tens of thousands of developers. UploadThing V7 — 6 months of work — is the best file upload solution on the web.", whyItMatters: "The T3 stack and UploadThing have become foundations for modern TypeScript apps. Backing Theo means backing the open-source infrastructure the entire dev community ships with.", launchNarrative: "T3 is the community token for TypeScript builders. Theo's open source work powers thousands of production apps — back the stack you ship with." },
    score: 85,
  },
  {
    twitterId: "seed_004", username: "marc_louvion", displayName: "Marc Lou",
    bio: "Shipping fast. 20+ apps launched. $50k MRR solo. Ship fast, learn fast.", followerCount: 95000,
    followingCount: 800, profileImageUrl: "https://unavatar.io/twitter/marc_louvion",
    posts: [{
      tweetId: "1711738505934856418",
      text: "I just sold Habits Garden, my first indie startup 🎉\n\n- 1 DM\n- 0 calls\n- $10,000\n\nThis is my 2nd startup acquisition this year but the story started in March 2022...\n\nI had 200 Twitter followers and barely any income ($700/month from an old startup). I love games, I love habits.",
      likeCount: 1800, retweetCount: 310, replyCount: 95, hasMedia: true, hasGithubLink: false, hasDemoLink: false,
    }],
    narrative: { tokenName: "Ship Fast Token", ticker: "SHIP", projectDesc: "Marc Lou went from $700/month to selling startups for $10K each — twice in one year. He ships complete SaaS products fast and consistently finds buyers before most devs finish their landing pages.", whyItMatters: "Marc's model — build fast, sell or grow, repeat — is the blueprint for modern indie hacking. He turned 200 Twitter followers into a serial acquisition machine.", launchNarrative: "SHIP is a community token for everyone who believes shipping beats perfecting. Marc Lou proves it every time he launches — and every time he sells." },
    score: 78,
  },
  {
    twitterId: "seed_005", username: "swyx", displayName: "swyx",
    bio: "Building in public at Latent Space. AI engineer. Open source contributor.", followerCount: 67000,
    followingCount: 1100, profileImageUrl: "https://unavatar.io/twitter/swyx",
    posts: [{
      tweetId: "1657892220492738560",
      text: "🐣 Introducing `smol-developer`!\n\n▸ Human-centric, coherent whole program synthesis\n▸ your own junior developer\n▸ develop, debug, decompile\n▸ open source\n▸ 200 LOC, half english\n\nInsights:\n💡 100k context can summarize both content and codebases\n💡 Smol is beautiful",
      likeCount: 5600, retweetCount: 1800, replyCount: 420, hasMedia: false, hasGithubLink: true, hasDemoLink: false,
    }],
    narrative: { tokenName: "AI Eng Token", ticker: "AIEN", projectDesc: "swyx open-sourced smol-developer — a 200-line AI agent that writes entire programs from a prompt. It hit 10K+ GitHub stars in days and shaped how the industry thinks about AI coding agents.", whyItMatters: "smol-developer was one of the first working AI developer tools and directly influenced the agent wave that followed. swyx is a primary source for AI engineering knowledge.", launchNarrative: "AIEN is for the AI engineering community. swyx's open-source work is shaping how the next generation of builders writes code — back the person advancing the craft." },
    score: 74,
  },
  {
    twitterId: "seed_006", username: "simonw", displayName: "Simon Willison",
    bio: "Creator of Django, Datasette. Writing about AI, open source, and building in public.", followerCount: 89000,
    followingCount: 2100, profileImageUrl: "https://unavatar.io/twitter/simonw",
    posts: [{
      tweetId: "1808880166343762185",
      text: "I've been building an AI-assisted personal assistant using LLM, datasette-llm-usage and Claude. Here's everything I learned about building production LLM applications after 18 months of daily use. This is the most useful thing I've built with AI.",
      likeCount: 2100, retweetCount: 480, replyCount: 130, hasMedia: false, hasGithubLink: true, hasDemoLink: false,
    }],
    narrative: { tokenName: "Datasette Token", ticker: "DATA", projectDesc: "Simon Willison co-created Django and built Datasette — open source tools used by journalists, researchers, and developers worldwide to explore and publish data.", whyItMatters: "Simon has spent 18 months deep in production LLM applications and shares every insight publicly. His tools are infrastructure for how the web handles data.", launchNarrative: "DATA is a community token for builders who believe open data is a public good. Simon's track record spans two decades of tools that developers actually use." },
    score: 71,
  },
];

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const reset = searchParams.get("reset") === "true";

  if (reset) {
    // Delete seed data in dependency order
    const seedTwitterIds = REAL_BUILDERS.map(b => b.twitterId);
    const builders = await prisma.builder.findMany({ where: { twitterId: { in: seedTwitterIds } } });
    const builderIds = builders.map((b: { id: string }) => b.id);
    const opps = await prisma.opportunity.findMany({ where: { builderId: { in: builderIds } } });
    const oppIds = opps.map((o: { id: string }) => o.id);

    await prisma.narrative.deleteMany({ where: { opportunityId: { in: oppIds } } });
    await prisma.opportunity.deleteMany({ where: { id: { in: oppIds } } });
    await prisma.post.deleteMany({ where: { builderId: { in: builderIds } } });
    await prisma.builder.deleteMany({ where: { id: { in: builderIds } } });
  }

  let inserted = 0;

  for (const mock of REAL_BUILDERS) {
    const builder = await prisma.builder.upsert({
      where: { twitterId: mock.twitterId },
      update: { profileImageUrl: mock.profileImageUrl, followerCount: mock.followerCount },
      create: {
        twitterId: mock.twitterId, username: mock.username, displayName: mock.displayName,
        bio: mock.bio, followerCount: mock.followerCount, followingCount: mock.followingCount,
        profileImageUrl: mock.profileImageUrl,
      },
    });

    for (const p of mock.posts) {
      const existing = await prisma.post.findUnique({ where: { tweetId: p.tweetId } });
      if (existing) continue;

      const post = await prisma.post.create({
        data: { ...p, builderId: builder.id, postedAt: new Date() },
      });

      const opp = await prisma.opportunity.create({
        data: {
          builderId: builder.id, postId: post.id, score: mock.score,
          scoreBreakdown: { engagement: Math.round(mock.score * 0.3), followerTier: Math.round(mock.score * 0.2), keywords: Math.round(mock.score * 0.2), media: Math.round(mock.score * 0.15), github: p.hasGithubLink ? 10 : 0, replies: p.replyCount > 5 ? 5 : 0 },
          status: "NARRATED",
        },
      });

      await prisma.narrative.create({
        data: { opportunityId: opp.id, ...mock.narrative },
      });

      inserted++;
    }
  }

  return NextResponse.json({ ok: true, inserted });
}
