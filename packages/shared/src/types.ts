export type OpportunityStatus = "PENDING" | "SCORED" | "NARRATED" | "LAUNCHED";

export interface Builder {
  id: string;
  twitterId: string;
  username: string;
  displayName: string;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  tweetId: string;
  builderId: string;
  text: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  hasMedia: boolean;
  hasGithubLink: boolean;
  hasDemoLink: boolean;
  postedAt: Date;
  createdAt: Date;
}

export interface ScoreBreakdown {
  engagement: number;
  followerTier: number;
  keywords: number;
  media: number;
  github: number;
  replies: number;
}

export interface Opportunity {
  id: string;
  builderId: string;
  postId: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  status: OpportunityStatus;
  createdAt: Date;
}

export interface Narrative {
  id: string;
  opportunityId: string;
  projectDesc: string;
  whyItMatters: string;
  tokenName: string;
  ticker: string;
  launchNarrative: string;
  createdAt: Date;
}

// Full opportunity with relations
export interface OpportunityWithRelations extends Opportunity {
  builder: Builder;
  post: Post;
  narrative: Narrative | null;
}

// API response types
export interface OpportunitiesResponse {
  opportunities: OpportunityWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScanResponse {
  scanned: number;
  newBuilders: number;
  newPosts: number;
  newOpportunities: number;
  narrativesGenerated: number;
}
