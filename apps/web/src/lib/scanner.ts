import { prisma } from "@bags-scout/db";
import { BUILDER_KEYWORDS, CHARITABLE_KEYWORDS, DEMO_LINK_PATTERNS, SEARCH_QUERIES } from "@bags-scout/shared";

// Known indie builders — all their tweets are relevant, no keyword filter needed
export const WATCHED_BUILDERS = [
  "levelsio", "marc_louvion", "t3dotgg", "dannypostmaa", "swyx", "simonw",
  "tdinh_me", "jasonleow", "therealhansolo", "pauloagm", "getakraft",
  "yannickgirard", "theandreboso", "ajlkn", "yongfook", "dvassallo",
  "arvidkahl", "pjrvs", "csallen", "stephsmithio", "heyeaslo",
  "andymci", "anthilemoon", "JanelSGM", "Prathkum",
];

// Known charitable / crowdfunding accounts to monitor
export const WATCHED_CHARITABLE = [
  "gofundme", "justgiving", "kickstarter", "indiegogo",
];

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  profile_image_url?: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
  entities?: {
    urls?: Array<{ expanded_url: string }>;
  };
  attachments?: {
    media_keys?: string[];
  };
}

interface TwitterSearchResponse {
  data?: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
  };
}

export interface ScanStats {
  scanned: number;
  newBuilders: number;
  newPosts: number;
  method: "search" | "timelines" | "none";
  error?: string;
  setupRequired?: boolean;
}

function isApiSetupError(msg: string): boolean {
  return (
    msg.includes("client-not-enrolled") ||
    msg.includes("Client Forbidden") ||
    msg.includes("453") ||
    msg.includes("required_enrollment")
  );
}

function isBasicTierError(msg: string): boolean {
  return msg.includes("client-not-enrolled") || msg.includes("403");
}

function detectLinks(tweet: TwitterTweet) {
  const urls = tweet.entities?.urls?.map((u) => u.expanded_url) ?? [];
  const fullText = tweet.text + " " + urls.join(" ");
  const hasGithubLink = urls.some((url) => url.includes("github.com"));
  const hasDemoLink = DEMO_LINK_PATTERNS.some((pattern) => pattern.test(fullText));
  const hasMedia = (tweet.attachments?.media_keys?.length ?? 0) > 0;
  return { hasGithubLink, hasDemoLink, hasMedia };
}

function isRelevantTweet(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    BUILDER_KEYWORDS.some((kw) => lower.includes(kw)) ||
    CHARITABLE_KEYWORDS.some((kw) => lower.includes(kw))
  );
}

async function xFetch(path: string, bearerToken: string) {
  const res = await fetch(`https://api.twitter.com/2${path}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API ${res.status}: ${body}`);
  }
  return res.json();
}

async function saveTweet(
  tweet: TwitterTweet,
  user: TwitterUser
): Promise<{ saved: boolean; isNewBuilder: boolean }> {
  const existingPost = await prisma.post.findUnique({ where: { tweetId: tweet.id } });
  if (existingPost) return { saved: false, isNewBuilder: false };

  const existingBuilder = await prisma.builder.findUnique({ where: { twitterId: user.id } });
  const isNewBuilder = !existingBuilder;

  let builderId: string;
  if (!existingBuilder) {
    const builder = await prisma.builder.create({
      data: {
        twitterId: user.id, username: user.username, displayName: user.name,
        bio: user.description ?? null,
        followerCount: user.public_metrics.followers_count,
        followingCount: user.public_metrics.following_count,
        profileImageUrl: user.profile_image_url ?? null,
      },
    });
    builderId = builder.id;
  } else {
    await prisma.builder.update({
      where: { id: existingBuilder.id },
      data: {
        followerCount: user.public_metrics.followers_count,
        followingCount: user.public_metrics.following_count,
        bio: user.description ?? null,
        profileImageUrl: user.profile_image_url ?? existingBuilder.profileImageUrl,
      },
    });
    builderId = existingBuilder.id;
  }

  const { hasGithubLink, hasDemoLink, hasMedia } = detectLinks(tweet);

  await prisma.post.create({
    data: {
      tweetId: tweet.id, builderId, text: tweet.text,
      likeCount: tweet.public_metrics.like_count,
      retweetCount: tweet.public_metrics.retweet_count,
      replyCount: tweet.public_metrics.reply_count,
      hasMedia, hasGithubLink, hasDemoLink,
      postedAt: new Date(tweet.created_at),
    },
  });

  return { saved: true, isNewBuilder };
}

// Scan via keyword search — requires X API Basic tier ($100/month)
async function scanViaSearch(bearerToken: string): Promise<ScanStats> {
  let scanned = 0;
  let newBuilders = 0;
  let newPosts = 0;

  const usersById = new Map<string, TwitterUser>();
  const allTweets: TwitterTweet[] = [];

  for (const query of SEARCH_QUERIES) {
    const params = new URLSearchParams({
      query, max_results: "10",
      expansions: "author_id,attachments.media_keys",
      "tweet.fields": "created_at,public_metrics,entities,attachments",
      "user.fields": "public_metrics,description,profile_image_url",
    });
    const result: TwitterSearchResponse = await xFetch(`/tweets/search/recent?${params}`, bearerToken);
    if (result.data) allTweets.push(...result.data);
    if (result.includes?.users) {
      for (const u of result.includes.users) usersById.set(u.id, u);
    }
    scanned += result.meta?.result_count ?? 0;
  }

  const uniqueTweets = Array.from(new Map(allTweets.map((t) => [t.id, t])).values());

  for (const tweet of uniqueTweets) {
    const user = usersById.get(tweet.author_id);
    if (!user || user.public_metrics.followers_count < 1000) continue;
    const { saved, isNewBuilder } = await saveTweet(tweet, user);
    if (saved) { newPosts++; if (isNewBuilder) newBuilders++; }
  }

  return { scanned, newBuilders, newPosts, method: "search" };
}

// Scan watched builder timelines — requires X API free tier (app must be in a Project)
async function scanViaTimelines(bearerToken: string): Promise<ScanStats> {
  let newBuilders = 0;
  let newPosts = 0;
  let scanned = 0;

  // Test with one account first to check if the API works at all
  const testRes = await xFetch(
    `/users/by/username/levelsio?user.fields=public_metrics,description,profile_image_url`,
    bearerToken
  );
  if (!testRes.data) throw new Error("X API returned no data for test user");

  const allAccounts = [
    ...WATCHED_BUILDERS.map((u) => ({ username: u, filterByKeywords: false })),
    ...WATCHED_CHARITABLE.map((u) => ({ username: u, filterByKeywords: true })),
  ];

  for (const { username, filterByKeywords } of allAccounts) {
    try {
      const userData = await xFetch(
        `/users/by/username/${username}?user.fields=public_metrics,description,profile_image_url`,
        bearerToken
      );
      const user: TwitterUser = userData.data;
      if (!user || user.public_metrics.followers_count < 1000) continue;

      const params = new URLSearchParams({
        max_results: "10",
        "tweet.fields": "created_at,public_metrics,entities,attachments",
        expansions: "attachments.media_keys",
        exclude: "retweets,replies",
      });

      const tweetsData = await xFetch(`/users/${user.id}/tweets?${params}`, bearerToken);
      const tweets: TwitterTweet[] = (tweetsData.data ?? []).map((t: TwitterTweet) => ({
        ...t, author_id: user.id,
      }));

      scanned += tweets.length;

      const relevant = filterByKeywords ? tweets.filter((t) => isRelevantTweet(t.text)) : tweets;

      for (const tweet of relevant) {
        const { saved, isNewBuilder } = await saveTweet(tweet, user);
        if (saved) { newPosts++; if (isNewBuilder) newBuilders++; }
      }
    } catch (err) {
      // Skip individual account errors (404 = user not found, etc.)
      const msg = err instanceof Error ? err.message : String(err);
      if (isApiSetupError(msg)) throw err; // propagate auth errors
      console.warn(`Skipping ${username}:`, msg);
    }
  }

  return { scanned, newBuilders, newPosts, method: "timelines" };
}

export async function runScan(): Promise<ScanStats> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) throw new Error("TWITTER_BEARER_TOKEN not set");

  // Try keyword search first (Basic tier)
  try {
    return await scanViaSearch(bearerToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!isBasicTierError(msg)) {
      // Unexpected error from search — still try timelines
      console.error("Search scan unexpected error:", msg);
    }
  }

  // Fall back to timeline scan (free tier — app must be in a Project)
  try {
    return await scanViaTimelines(bearerToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Timeline scan failed:", msg);

    if (isApiSetupError(msg)) {
      return {
        scanned: 0, newBuilders: 0, newPosts: 0, method: "none",
        setupRequired: true,
        error: "Your X developer app needs to be inside a Project. Go to developer.twitter.com → Projects & Apps → move your app into a project, then regenerate your bearer token.",
      };
    }

    return { scanned: 0, newBuilders: 0, newPosts: 0, method: "none", error: msg };
  }
}
