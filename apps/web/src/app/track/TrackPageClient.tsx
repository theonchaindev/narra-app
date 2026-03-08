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
    <div className="bg-black/20 border border-white/8 rounded-xl p-3 space-y-2.5 hover:border-white/15 transition-colors">
      <p className="text-xs text-white/75 leading-relaxed">{tweet.text}</p>

      <div className="flex items-center gap-2 text-[10px] text-white/30 flex-wrap">
        <span>{timeAgo(tweet.createdAt)}</span>
        <span>·</span>
        <span>{formatCount(tweet.likeCount)} ♥</span>
        <span>·</span>
        <span>{formatCount(tweet.retweetCount)} RT</span>
        {tweet.hasGithubLink && <span className="text-white/40 bg-white/5 px-1.5 py-0.5 rounded">GH</span>}
        {tweet.hasMedia && <span className="text-white/40 bg-white/5 px-1.5 py-0.5 rounded">Media</span>}
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <a
          href={tweet.tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1"
        >
          View
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <div className="flex-1" />
        <button
          onClick={handleLaunch}
          disabled={launching}
          className="px-2.5 py-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
        >
          {launching ? (
            <>
              <span className="w-2.5 h-2.5 border-[1.5px] border-black/30 border-t-black rounded-full animate-spin" />
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

function AccountColumn({
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
        if (json.error) setError(json.error);
        else setData(json);
      } catch {
        setError("Failed to load tweets");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [account.username]);

  return (
    <div className="flex flex-col bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden min-w-0">
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8 shrink-0">
        {data?.user.profileImageUrl ? (
          <Image
            src={data.user.profileImageUrl}
            alt={data.user.displayName}
            width={32}
            height={32}
            className="rounded-full ring-1 ring-white/10 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/40 shrink-0">
            {account.username[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate leading-tight">
            {data?.user.displayName ?? `@${account.username}`}
          </p>
          <p className="text-[10px] text-white/35 truncate">
            @{account.username}
            {data && ` · ${formatCount(data.user.followerCount)}`}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 text-white/30 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5"
            title={expanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => onRemove(account.username)}
            className="p-1 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
            title="Remove"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tweet list — scrollable */}
      {expanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[600px]">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-white/35 py-4 justify-center">
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
              Loading...
            </div>
          )}
          {error && <p className="text-xs text-red-400 px-1">{error}</p>}
          {!loading && !error && data?.tweets.length === 0 && (
            <p className="text-xs text-white/30 px-1 py-4 text-center">No recent tweets.</p>
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
    <div className="px-4 sm:px-6 py-8">
      {/* Top bar */}
      <div className="flex items-end gap-4 mb-6 max-w-screen-xl mx-auto">
        <div className="flex-1">
          <h1 className="text-xl font-bold mb-0.5">Track Accounts</h1>
          <p className="text-xs text-white/35">Monitor X accounts and generate a launch from any tweet.</p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="@username"
            className="w-44 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !input.trim()}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {adding
              ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : "Add"
            }
          </button>
        </form>
      </div>

      {addError && <p className="text-xs text-red-400 mb-4 max-w-screen-xl mx-auto">{addError}</p>}
      {launchError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 max-w-screen-xl mx-auto">
          {launchError}
        </div>
      )}

      {/* Columns grid */}
      <div className="max-w-screen-xl mx-auto">
        {loadingAccounts ? (
          <div className="flex items-center gap-2 text-sm text-white/40 py-16 justify-center">
            <span className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
            Loading...
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-24 text-white/25">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">No accounts tracked yet.</p>
            <p className="text-xs mt-1 opacity-60">Add an X username above to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(accounts.length, 4)}, minmax(0, 1fr))` }}>
            {accounts.map((account) => (
              <AccountColumn
                key={account.id}
                account={account}
                onRemove={handleRemove}
                onLaunch={handleLaunch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
