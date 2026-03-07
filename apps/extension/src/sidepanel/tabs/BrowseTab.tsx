import React, { useEffect, useState } from "react";
import type { RawDetection } from "../../content/index";
import { NarrativeCard } from "../components/NarrativeCard";
import { generateNarrativeForBuilder, type Opportunity } from "../../lib/narraApi";

interface EnrichedDetection extends RawDetection {
  opportunity?: Opportunity;
  loading?: boolean;
}

export function BrowseTab() {
  const [builders, setBuilders] = useState<EnrichedDetection[]>([]);

  useEffect(() => {
    const load = async () => {
      const stored = await chrome.storage.session.get("detectedBuilders");
      const list: RawDetection[] = stored.detectedBuilders ?? [];
      setBuilders(list.map((b) => ({ ...b })));
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleGenerate(index: number) {
    const builder = builders[index];
    setBuilders((prev) => prev.map((b, i) => (i === index ? { ...b, loading: true } : b)));
    const opp = await generateNarrativeForBuilder(builder.username, builder.tweetText).catch(() => null);
    setBuilders((prev) =>
      prev.map((b, i) => (i === index ? { ...b, loading: false, opportunity: opp ?? undefined } : b))
    );
  }

  if (builders.length === 0) {
    return (
      <div style={{ textAlign: "center", paddingTop: 40 }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>👀</div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, padding: "0 8px" }}>
          Browse your X timeline. Narra will detect builders (1k+ followers) and charitable causes as you scroll.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {builders.map((b, i) => (
        <DetectedBuilderCard
          key={b.tweetId}
          detection={b}
          onGenerate={() => handleGenerate(i)}
        />
      ))}
    </div>
  );
}

function DetectedBuilderCard({
  detection,
  onGenerate,
}: {
  detection: EnrichedDetection;
  onGenerate: () => void;
}) {
  if (detection.opportunity) {
    return <NarrativeCard opportunity={detection.opportunity} />;
  }

  const color = detection.isCharitable ? "#60a5fa" : "#4ade80";
  const tag = detection.isCharitable ? "Charitable" : "Builder";

  return (
    <div style={card}>
      {/* Tag */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 8px", borderRadius: 20, marginBottom: 8,
        background: `${color}1a`, border: `1px solid ${color}4d`,
        fontSize: 10, fontWeight: 700, color, letterSpacing: "0.05em",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
        {tag}
      </div>

      {/* Builder */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {detection.avatarUrl && (
          <img src={detection.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
        )}
        <div>
          <p style={{ fontWeight: 600, fontSize: 13 }}>{detection.displayName}</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>@{detection.username}</p>
        </div>
      </div>

      {/* Post */}
      <p style={{
        fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5,
        marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {detection.tweetText}
      </p>

      <a
        href={detection.tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 10 }}
      >
        View post →
      </a>

      <button onClick={onGenerate} disabled={detection.loading} style={btnPrimary}>
        {detection.loading ? "Generating..." : "Generate Narrative"}
      </button>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: 12,
};

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "9px", background: "#22c55e",
  color: "#000", fontWeight: 700, fontSize: 13,
  border: "none", borderRadius: 8, cursor: "pointer",
};
