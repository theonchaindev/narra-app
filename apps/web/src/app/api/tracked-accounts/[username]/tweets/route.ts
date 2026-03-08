import { NextResponse } from "next/server";

async function xFetch(path: string) {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) throw new Error("TWITTER_BEARER_TOKEN not set");
  const res = await fetch(`https://api.twitter.com/2${path}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const userData = await xFetch(
      `/users/by/username/${username}?user.fields=public_metrics,description,profile_image_url`
    );

    if (!userData.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userData.data;

    const tweetsData = await xFetch(
      `/users/${user.id}/tweets?max_results=20&tweet.fields=created_at,public_metrics,entities,attachments&expansions=attachments.media_keys&exclude=retweets,replies`
    );

    const tweets = (tweetsData.data ?? []).map((t: {
      id: string;
      text: string;
      created_at: string;
      public_metrics: { like_count: number; retweet_count: number; reply_count: number };
      entities?: { urls?: Array<{ expanded_url: string }> };
      attachments?: { media_keys?: string[] };
    }) => ({
      id: t.id,
      text: t.text,
      createdAt: t.created_at,
      likeCount: t.public_metrics.like_count,
      retweetCount: t.public_metrics.retweet_count,
      replyCount: t.public_metrics.reply_count,
      hasMedia: (t.attachments?.media_keys?.length ?? 0) > 0,
      hasGithubLink: t.entities?.urls?.some((u) => u.expanded_url.includes("github.com")) ?? false,
      hasDemoLink: false,
      tweetUrl: `https://x.com/${username}/status/${t.id}`,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.name,
        bio: user.description ?? null,
        followerCount: user.public_metrics.followers_count,
        profileImageUrl: user.profile_image_url ?? null,
      },
      tweets,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
