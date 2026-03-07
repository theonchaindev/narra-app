import { NextRequest, NextResponse } from "next/server";
import { BUILDER_KEYWORDS } from "@bags-scout/shared";

const CHARITABLE_KEYWORDS = [
  "gofundme", "fundraising", "donation", "charity", "nonprofit",
  "please help", "crowdfund", "need funds", "help us build", "support us",
  "raising money", "medical fund", "community fund",
];

export interface BuilderValidation {
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

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  const postText = req.nextUrl.searchParams.get("text") ?? "";

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const bearer = process.env.TWITTER_BEARER_TOKEN;
  if (!bearer) {
    // No API key — do basic keyword check only, skip follower validation
    const lower = postText.toLowerCase();
    const isBuilder = BUILDER_KEYWORDS.some((kw) => lower.includes(kw));
    const isCharitable = CHARITABLE_KEYWORDS.some((kw) => lower.includes(kw));
    return NextResponse.json({
      valid: isBuilder || isCharitable,
      reason: isBuilder || isCharitable ? undefined : "No builder or charitable signals",
      username,
      displayName: username,
      followerCount: 0,
      bio: "",
      profileImageUrl: "",
      isBuilder,
      isCharitable,
    } satisfies BuilderValidation);
  }

  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,description,profile_image_url,name`,
      { headers: { Authorization: `Bearer ${bearer}` } }
    );

    if (!res.ok) {
      return NextResponse.json({ valid: false, reason: "User not found" }, { status: 200 });
    }

    const json = await res.json();
    const user = json.data;
    if (!user) return NextResponse.json({ valid: false, reason: "User not found" }, { status: 200 });

    const followerCount: number = user.public_metrics?.followers_count ?? 0;
    const bio: string = user.description ?? "";
    const combined = (postText + " " + bio).toLowerCase();

    const isBuilder = BUILDER_KEYWORDS.some((kw) => combined.includes(kw));
    const isCharitable = CHARITABLE_KEYWORDS.some((kw) => combined.includes(kw));

    if (followerCount < 1000) {
      return NextResponse.json({
        valid: false,
        reason: `Only ${followerCount.toLocaleString()} followers (need 1k+)`,
        username,
        displayName: user.name,
        followerCount,
        bio,
        profileImageUrl: user.profile_image_url ?? "",
        isBuilder,
        isCharitable,
      } satisfies BuilderValidation);
    }

    if (!isBuilder && !isCharitable) {
      return NextResponse.json({
        valid: false,
        reason: "No builder or charitable signals detected",
        username,
        displayName: user.name,
        followerCount,
        bio,
        profileImageUrl: user.profile_image_url ?? "",
        isBuilder,
        isCharitable,
      } satisfies BuilderValidation);
    }

    return NextResponse.json({
      valid: true,
      username,
      displayName: user.name,
      followerCount,
      bio,
      profileImageUrl: user.profile_image_url ?? "",
      isBuilder,
      isCharitable,
    } satisfies BuilderValidation);
  } catch (err) {
    return NextResponse.json({ valid: false, reason: "Validation error" }, { status: 200 });
  }
}
