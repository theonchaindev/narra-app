// Content script — runs on x.com
// Passively scans the timeline for builder/charitable posts, validates via background

import { BUILDER_KEYWORDS } from "@bags-scout/shared";

const CHARITABLE_KEYWORDS = [
  "gofundme", "fundraising", "donation", "charity", "nonprofit",
  "please help", "crowdfund", "need funds", "help us build", "support us",
  "raising money", "medical fund", "community fund",
];

export interface RawDetection {
  username: string;
  displayName: string;
  tweetText: string;
  tweetId: string;
  tweetUrl: string;
  avatarUrl: string;
  isCharitable: boolean;
  detectedAt: number;
}

const scannedTweetIds = new Set<string>();
const validatedUsernames = new Map<string, boolean>(); // username → valid

function hasBuilderSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return BUILDER_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasCharitableSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return CHARITABLE_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractTweetData(article: Element): RawDetection | null {
  const textEl = article.querySelector("[data-testid='tweetText']");
  if (!textEl) return null;
  const text = textEl.textContent ?? "";

  const isBuilder = hasBuilderSignal(text);
  const isCharitable = hasCharitableSignal(text);
  if (!isBuilder && !isCharitable) return null;

  // Username from the tweet's profile link
  const userLink = article.querySelector("a[href^='/'][role='link'] span") as HTMLElement | null;
  const hrefEl = article.querySelector("a[href^='/'][role='link']") as HTMLAnchorElement | null;
  const href = hrefEl?.getAttribute("href") ?? "";
  const username = href.replace(/^\//, "").split("/")[0];
  if (!username || username.includes("?") || username === "i") return null;

  const displayName = userLink?.textContent ?? username;

  const avatarEl = article.querySelector("img[src*='profile_images']") as HTMLImageElement | null;
  const avatarUrl = avatarEl?.src ?? "";

  const linkEl = article.querySelector("a[href*='/status/']") as HTMLAnchorElement | null;
  const tweetHref = linkEl?.getAttribute("href") ?? "";
  const tweetId = tweetHref.split("/status/")[1]?.split("?")[0] ?? "";
  if (!tweetId || scannedTweetIds.has(tweetId)) return null;
  scannedTweetIds.add(tweetId);

  const tweetUrl = `https://x.com${tweetHref}`;

  return { username, displayName, tweetText: text, tweetId, tweetUrl, avatarUrl, isCharitable, detectedAt: Date.now() };
}

function addBuilderBadge(article: Element, detection: RawDetection) {
  if (article.querySelector(".narra-badge")) return;

  const badge = document.createElement("div");
  badge.className = "narra-badge";

  const color = detection.isCharitable ? "#60a5fa" : "#4ade80";
  const label = detection.isCharitable ? "Charitable cause" : "Builder detected";

  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    padding: 4px 10px;
    background: ${color}1a;
    border: 1px solid ${color}4d;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    color: ${color};
    font-family: system-ui, sans-serif;
    cursor: pointer;
    user-select: none;
  `;
  badge.innerHTML = `
    <span style="width:6px;height:6px;background:${color};border-radius:50%;display:inline-block;flex-shrink:0"></span>
    ${label} — View in Narra
  `;

  badge.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL" });
  });

  const actionsGroup = article.querySelector("[role='group']");
  if (actionsGroup) {
    actionsGroup.parentElement?.insertBefore(badge, actionsGroup);
  } else {
    article.appendChild(badge);
  }
}

async function processArticle(article: Element) {
  const detection = extractTweetData(article);
  if (!detection) return;

  // Check cache first
  const cached = validatedUsernames.get(detection.username);
  if (cached === false) return; // known invalid, skip

  // Notify background to validate (it calls Narra API with X API check)
  chrome.runtime.sendMessage(
    { type: "VALIDATE_BUILDER", data: detection },
    (response: { valid: boolean } | undefined) => {
      if (chrome.runtime.lastError) return;
      if (!response) return;
      validatedUsernames.set(detection.username, response.valid);
      if (response.valid) {
        addBuilderBadge(article, detection);
      }
    }
  );
}

function scanTimeline() {
  const articles = document.querySelectorAll("article[data-testid='tweet']");
  for (const article of articles) {
    processArticle(article);
  }
}

// Initial scan + observe DOM for new tweets
scanTimeline();
const observer = new MutationObserver(() => scanTimeline());
observer.observe(document.body, { childList: true, subtree: true });
