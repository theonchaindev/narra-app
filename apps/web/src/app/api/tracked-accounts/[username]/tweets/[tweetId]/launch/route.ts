import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";
import { scorePost } from "@/lib/scorer";
import { generateNarrative } from "@/lib/narrative";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; tweetId: string }> }
) {
  const { tweetId } = await params;
  const body = await req.json();

  // Expect tweet data and user data sent from the client (already fetched)
  const { tweet, user } = body as {
    tweet: {
      id: string;
      text: string;
      createdAt: string;
      likeCount: number;
      retweetCount: number;
      replyCount: number;
      hasMedia: boolean;
      hasGithubLink: boolean;
      hasDemoLink: boolean;
    };
    user: {
      id: string;
      username: string;
      displayName: string;
      bio: string | null;
      followerCount: number;
      profileImageUrl: string | null;
    };
  };

  if (!tweet || !user) {
    return NextResponse.json({ error: "tweet and user data required" }, { status: 400 });
  }

  // Check if this tweet is already an opportunity
  const existingPost = await prisma.post.findUnique({
    where: { tweetId },
    include: { opportunity: { include: { narrative: true } } },
  });

  if (existingPost?.opportunity) {
    return NextResponse.json({ opportunityId: existingPost.opportunity.id });
  }

  // Upsert builder
  let builder = await prisma.builder.findUnique({ where: { twitterId: user.id } });
  if (!builder) {
    builder = await prisma.builder.create({
      data: {
        twitterId: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        followerCount: user.followerCount,
        followingCount: 0,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } else {
    await prisma.builder.update({
      where: { id: builder.id },
      data: {
        followerCount: user.followerCount,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl ?? builder.profileImageUrl,
      },
    });
  }

  // Create post if it doesn't exist
  let post = existingPost;
  if (!post) {
    post = await prisma.post.create({
      data: {
        tweetId,
        builderId: builder.id,
        text: tweet.text,
        likeCount: tweet.likeCount,
        retweetCount: tweet.retweetCount,
        replyCount: tweet.replyCount,
        hasMedia: tweet.hasMedia,
        hasGithubLink: tweet.hasGithubLink,
        hasDemoLink: tweet.hasDemoLink,
        postedAt: new Date(tweet.createdAt),
      },
    }) as typeof post;
  }

  // Score
  const { total, breakdown } = scorePost(tweet, user.followerCount);

  // Create opportunity
  const opportunity = await prisma.opportunity.create({
    data: {
      builderId: builder.id,
      postId: post!.id,
      score: total,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scoreBreakdown: breakdown as unknown as any,
      status: "SCORED",
    },
  });

  // Generate narrative immediately
  try {
    const narrative = await generateNarrative({
      displayName: user.displayName,
      username: user.username,
      bio: user.bio,
      followerCount: user.followerCount,
      postText: tweet.text,
      likeCount: tweet.likeCount,
      retweetCount: tweet.retweetCount,
    });

    await prisma.$transaction([
      prisma.narrative.create({
        data: {
          opportunityId: opportunity.id,
          projectDesc: narrative.projectDesc,
          whyItMatters: narrative.whyItMatters,
          tokenName: narrative.tokenName,
          ticker: narrative.ticker,
          launchNarrative: narrative.launchNarrative,
        },
      }),
      prisma.opportunity.update({
        where: { id: opportunity.id },
        data: { status: "NARRATED" },
      }),
    ]);
  } catch (err) {
    console.error("Narrative generation failed:", err);
    // Still return opportunity — user can generate narrative from the detail page
  }

  return NextResponse.json({ opportunityId: opportunity.id });
}
