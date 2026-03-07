export const BUILDER_KEYWORDS = [
  "building in public",
  "built this",
  "just shipped",
  "shipped today",
  "just launched",
  "launched my",
  "open source",
  "indie hacker",
  "side project",
  "saas",
  "demo",
  "mvp",
  "v1",
  "product update",
  "milestone",
  "revenue",
  "users",
  "feedback",
  "weekend project",
  "solo founder",
  "bootstrapped",
  "mrr",
  "arr",
  "startup",
  "shipped",
  "built",
  "launched",
  "release",
  "update",
];

export const CHARITABLE_KEYWORDS = [
  "gofundme",
  "fundraising",
  "donation",
  "charity",
  "nonprofit",
  "crowdfund",
  "please help",
  "need funds",
  "raising money",
  "help us",
  "support our",
  "medical bills",
  "going through",
  "struggling",
];

export const SEARCH_QUERIES = [
  '"building in public" -is:retweet lang:en',
  '"just shipped" -is:retweet lang:en',
  '"launched my" -is:retweet lang:en',
  '"indie hacker" demo -is:retweet lang:en',
  '"open source" shipped -is:retweet lang:en',
  'gofundme fundraising -is:retweet lang:en',
  '"just launched" charity -is:retweet lang:en',
];

export const DEMO_LINK_PATTERNS = [
  /loom\.com/i,
  /youtube\.com/i,
  /youtu\.be/i,
  /demo\./i,
  /\.vercel\.app/i,
  /netlify\.app/i,
  /railway\.app/i,
];

export const MIN_SCORE_FOR_NARRATIVE = 30;
export const PAGE_SIZE = 20;
