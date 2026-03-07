import React, { useEffect, useState } from "react";
import { getTopOpportunities, triggerScan, type Opportunity } from "../../lib/narraApi";
import { NarrativeCard } from "../components/NarrativeCard";

export function ScanTab() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const opps = await getTopOpportunities(20).catch(() => []);
    setOpportunities(opps);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleScan() {
    setScanning(true);
    const result = await triggerScan().catch(() => null);
    setScanning(false);
    if (result) {
      setLastScan(`+${result.newPosts} posts · ${result.narrativesGenerated} narratives`);
      await load();
    }
  }

  return (
    <div>
      {/* Scan button */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={handleScan} disabled={scanning} style={{
          width: "100%", padding: "9px", borderRadius: 8, border: "none",
          background: scanning ? "rgba(34,197,94,0.4)" : "#22c55e",
          color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          {scanning ? "Scanning X..." : "Scan X Now"}
        </button>
        {lastScan && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 5 }}>
            {lastScan}
          </p>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            No opportunities yet. Hit Scan X to discover builders.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {opportunities.map((opp) => (
            <NarrativeCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
