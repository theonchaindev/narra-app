"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TrackedAccount {
  id: string;
  username: string;
  addedAt: string;
}

interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  hasMedia: boolean;
  hasGithubLink: boolean;
  hasDemoLink: boolean;
  tweetUrl: string;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  followerCount: number;
  profileImageUrl: string | null;
}

interface AccountData {
  user: UserProfile;
  tweets: Tweet[];
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function TweetCard({
  tweet,
  user,
  onLaunch,
}: {
  tweet: Tweet;
  user: UserProfile;
  onLaunch: (tweet: Tweet, user: UserProfile) => void;
}) {
  const [launching, setLaunching] = useState(false);

  async function handleLaunch() {
    setLaunching(true);
    onLaunch(tweet, user);
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <p className="text-sm text-white/80 leading-relaxed">{tweet.text}</p>

      <div className="flex items-center gap-3 text-xs text-white/35">
        <span>{timeAgo(tweet.createdAt)}</span>
        <span>·</span>
        <span>{formatCount(tweet.likeCount)} likes</span>
        <span>·</span>
        <span>{formatCount(tweet.retweetCount)} RTs</span>
        {tweet.hasGithubLink && (
          <>
            <span>·</span>
            <span className="text-white/50">GitHub</span>
          </>
        )}
        {tweet.hasMedia && (
          <>
            <span>·</span>
            <span className="text-white/50">Media</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <a
          href={tweet.tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/35 hover:text-white/60 transition-colors flex items-center gap-1"
        >
          View on X
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <div className="flex-1" />

        <button
          onClick={handleLaunch}
          disabled={launching}
          className="px-3 py-1.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
        >
          {launching ? (
            <>
              <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Launch"
          )}
        </button>
      </div>
    </div>
  );
}

function AccountSection({
  account,
  onRemove,
  onLaunch,
}: {
  account: TrackedAccount;
  onRemove: (username: string) => void;
  onLaunch: (tweet: Tweet, user: UserProfile) => void;
}) {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/tracked-accounts/${account.username}/tweets`);
        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      } catch {
        setError("Failed to load tweets");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [account.username]);

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {data?.user.profileImageUrl ? (
          <Image
            src={data.user.profileImageUrl}
            alt={data.user.displayName}
            width={40}
            height={40}
            className="rounded-full ring-1 ring-white/10 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white/40 shrink-0">
            {account.username[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">
              {data?.user.displayName ?? `@${account.username}`}
            </p>
            {data && (
              <span className="text-xs text-white/35 shrink-0">
                {formatCount(data.user.followerCount)} followers
              </span>
            )}
          </div>
          <p className="text-xs text-white/40">@{account.username}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-white/40 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => onRemove(account.username)}
            className="p-1.5 text-white/25 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tweets */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-white/40 py-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
              Loading tweets...
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && data?.tweets.length === 0 && (
            <p className="text-sm text-white/35">No recent tweets found.</p>
          )}
          {!loading && !error && data?.tweets.map((tweet) => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              user={data.user}
              onLaunch={onLaunch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TrackPageClient() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<TrackedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [launchError, setLaunchError] = useState("");

  useEffect(() => {
    fetch("/api/tracked-accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []))
      .finally(() => setLoadingAccounts(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const username = input.trim().replace(/^@/, "");
    if (!username) return;

    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/tracked-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.error) {
        setAddError(data.error);
      } else {
        setAccounts((prev) => {
          if (prev.some((a) => a.username === data.account.username)) return prev;
          return [data.account, ...prev];
        });
        setInput("");
      }
    } catch {
      setAddError("Failed to add account");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(username: string) {
    setAccounts((prev) => prev.filter((a) => a.username !== username));
    await fetch(`/api/tracked-accounts/${username}`, { method: "DELETE" });
  }

  const handleLaunch = useCallback(
    async (tweet: Tweet, user: UserProfile) => {
      setLaunchError("");
      try {
        const res = await fetch(
          `/api/tracked-accounts/${user.username}/tweets/${tweet.id}/launch`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tweet, user }),
          }
        );
        const data = await res.json();
        if (data.opportunityId) {
          router.push(`/opportunity/${data.opportunityId}`);
        } else {
          setLaunchError(data.error ?? "Launch failed");
        }
      } catch {
        setLaunchError("Network error. Try again.");
      }
    },
    [router]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Track Accounts</h1>
        <p className="text-sm text-white/40">
          Add X accounts to monitor. Pick any tweet and generate a launch in one click.
        </p>
      </div>

      {/* Add account form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="@username"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 focus:bg-white/8 transition-colors"
        />
        <button
          type="submit"
          disabled={adding || !input.trim()}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          {adding ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            "Add"
          )}
        </button>
      </form>

      {addError && <p className="text-xs text-red-400 mb-4">{addError}</p>}
      {launchError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
          {launchError}
        </div>
      )}

      {/* Accounts list */}
      {loadingAccounts ? (
        <div className="flex items-center gap-2 text-sm text-white/40 py-8">
          <span className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
          Loading...
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">No accounts tracked yet.</p>
          <p className="text-xs mt-1">Add an X username above to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <AccountSection
              key={account.id}
              account={account}
              onRemove={handleRemove}
              onLaunch={handleLaunch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
