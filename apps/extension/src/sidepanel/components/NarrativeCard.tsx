import React, { useState } from "react";
import type { Opportunity } from "../../lib/narraApi";
import { getWalletInfo, MIN_LAUNCH_SOL } from "../../lib/wallet";
import { launchToken } from "../../lib/narraApi";

const NARRA_BASE = "http://localhost:3001";

type LaunchState = "idle" | "checking" | "needs-funds" | "confirming" | "launching" | "done" | "error";

export function NarrativeCard({ opportunity }: { opportunity: Opportunity }) {
  const { builder, post, narrative, score } = opportunity;
  const [launchState, setLaunchState] = useState<LaunchState>("idle");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [mintAddress, setMintAddress] = useState("");
  const [error, setError] = useState("");

  const tweetUrl = `https://x.com/${builder.username}/status/${post.tweetId}`;

  const scoreColor = score >= 70 ? "#4ade80" : score >= 45 ? "#fbbf24" : "#fb923c";

  async function handleLaunch() {
    if (!narrative) return;
    setLaunchState("checking");

    const walletInfo = await getWalletInfo();
    setWalletBalance(walletInfo.balanceSol);
    setWalletAddress(walletInfo.publicKey);

    if (!walletInfo.canLaunch) {
      setLaunchState("needs-funds");
      return;
    }

    setLaunchState("confirming");
  }

  async function confirmLaunch() {
    setLaunchState("launching");
    try {
      const walletInfo = await getWalletInfo();
      const result = await launchToken(opportunity.id, walletInfo.publicKey);
      if (result.success) {
        setMintAddress(result.tokenMint ?? "");
        setLaunchState("done");
      } else {
        setError(result.error ?? "Launch failed");
        setLaunchState("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed");
      setLaunchState("error");
    }
  }

  if (!narrative) {
    return (
      <div style={cardStyle}>
        <BuilderHeader builder={builder} score={score} scoreColor={scoreColor} />
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
          Generating narrative...
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <BuilderHeader builder={builder} score={score} scoreColor={scoreColor} />

      {/* Post */}
      <a href={tweetUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: 8 }}>
        <p style={{
          fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {post.text}
        </p>
      </a>

      {/* Token */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 10,
      }}>
        <div style={pill}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Token</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{narrative.tokenName}</span>
        </div>
        <div style={pill}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Ticker</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", fontFamily: "monospace" }}>
            ${narrative.ticker}
          </span>
        </div>
      </div>

      {/* Narrative desc */}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 10 }}>
        {narrative.projectDesc}
      </p>

      {/* Launch states */}
      {launchState === "idle" && (
        <button onClick={handleLaunch} style={btnPrimary}>Launch via Bags</button>
      )}

      {launchState === "checking" && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Checking wallet...</p>
      )}

      {launchState === "needs-funds" && (
        <div>
          <div style={{
            padding: "10px 12px", borderRadius: 10, marginBottom: 8,
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
          }}>
            <p style={{ fontSize: 12, color: "#fcd34d", marginBottom: 4 }}>
              Wallet needs funding
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              Balance: {walletBalance.toFixed(4)} SOL · Need {MIN_LAUNCH_SOL} SOL
            </p>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8, wordBreak: "break-all" }}>
            Send SOL to: {walletAddress}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setLaunchState("idle")} style={{ ...btnGhost, flex: 1 }}>Back</button>
            <button onClick={handleLaunch} style={{ ...btnPrimary, flex: 1 }}>Check again</button>
          </div>
        </div>
      )}

      {launchState === "confirming" && (
        <div>
          <div style={{
            padding: "10px 12px", borderRadius: 10, marginBottom: 10,
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
          }}>
            <p style={{ fontSize: 12, color: "#4ade80", marginBottom: 4, fontWeight: 600 }}>Ready to launch</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              ${narrative.ticker} · {narrative.tokenName}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
              Wallet: {walletBalance.toFixed(4)} SOL ✓
            </p>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 8, textAlign: "center" }}>
            Community Support Launch. Creator not verified.
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setLaunchState("idle")} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
            <button onClick={confirmLaunch} style={{ ...btnPrimary, flex: 1 }}>Confirm Launch</button>
          </div>
        </div>
      )}

      {launchState === "launching" && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
          Launching token...
        </p>
      )}

      {launchState === "done" && (
        <div style={{
          padding: "10px 12px", borderRadius: 10,
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
        }}>
          <p style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>
            ${narrative.ticker} launched!
          </p>
          {mintAddress && (
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", wordBreak: "break-all" }}>
              Mint: {mintAddress}
            </p>
          )}
          <a
            href={`${NARRA_BASE}/opportunity/${opportunity.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "block", fontSize: 11, color: "#4ade80", marginTop: 6 }}
          >
            View on Narra →
          </a>
        </div>
      )}

      {launchState === "error" && (
        <div>
          <p style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>{error}</p>
          <button onClick={() => setLaunchState("idle")} style={btnGhost}>Try again</button>
        </div>
      )}
    </div>
  );
}

function BuilderHeader({
  builder,
  score,
  scoreColor,
}: {
  builder: Opportunity["builder"];
  score: number;
  scoreColor: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {builder.profileImageUrl ? (
          <img src={builder.profileImageUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)",
          }}>
            {builder.displayName[0]}
          </div>
        )}
        <div>
          <p style={{ fontWeight: 600, fontSize: 12 }}>{builder.displayName}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
            @{builder.username} · {builder.followerCount.toLocaleString()} followers
          </p>
        </div>
      </div>
      <div style={{
        padding: "2px 7px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: `${scoreColor}1a`, border: `1px solid ${scoreColor}4d`, color: scoreColor,
        fontFamily: "monospace",
      }}>
        {score}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: 12,
};

const pill: React.CSSProperties = {
  flex: 1, padding: "6px 8px", borderRadius: 8,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  display: "flex", flexDirection: "column", gap: 1,
};

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "9px", background: "#22c55e",
  color: "#000", fontWeight: 700, fontSize: 13,
  border: "none", borderRadius: 8, cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "7px 12px", background: "transparent",
  color: "rgba(255,255,255,0.5)", fontSize: 12,
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer",
};
