import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";
import { generateNarrative } from "@/lib/narrative";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { builder: true, post: true, narrative: true },
  });

  if (!opportunity) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  if (opportunity.narrative) {
    return NextResponse.json({ success: true, alreadyExists: true });
  }

  try {
    const narrative = await generateNarrative({
      displayName: opportunity.builder.displayName,
      username: opportunity.builder.username,
      bio: opportunity.builder.bio,
      followerCount: opportunity.builder.followerCount,
      postText: opportunity.post.text,
      likeCount: opportunity.post.likeCount,
      retweetCount: opportunity.post.retweetCount,
    });

    await prisma.$transaction([
      prisma.narrative.create({
        data: {
          opportunityId: id,
          projectDesc: narrative.projectDesc,
          whyItMatters: narrative.whyItMatters,
          tokenName: narrative.tokenName,
          ticker: narrative.ticker,
          launchNarrative: narrative.launchNarrative,
        },
      }),
      prisma.opportunity.update({
        where: { id },
        data: { status: "NARRATED" },
      }),
    ]);

    return NextResponse.json({ success: true, narrative });
  } catch (err) {
    console.error("Narrative generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
