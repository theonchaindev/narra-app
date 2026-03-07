import React, { useState, useEffect } from "react";
import { BrowseTab } from "./tabs/BrowseTab";
import { ScanTab } from "./tabs/ScanTab";
import { WalletTab } from "./tabs/WalletTab";
import { getWalletInfo } from "../lib/wallet";

type Tab = "browse" | "scan" | "wallet";

export function App() {
  const [tab, setTab] = useState<Tab>("browse");
  const [browseCount, setBrowseCount] = useState(0);
  const [walletReady, setWalletReady] = useState(false);

  // Poll browse count badge
  useEffect(() => {
    const poll = async () => {
      const stored = await chrome.storage.session.get("detectedBuilders");
      setBrowseCount((stored.detectedBuilders ?? []).length);
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  // Check wallet status
  useEffect(() => {
    getWalletInfo().then((info) => setWalletReady(info.canLaunch));
  }, [tab]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
      }}>
        <img src="/icons/icon128.png" alt="Narra" style={{ width: 22, height: 22, borderRadius: 5 }} />
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>Narra Scout</span>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "0 10px",
        flexShrink: 0,
      }}>
        <TabBtn active={tab === "browse"} onClick={() => setTab("browse")} badge={browseCount || undefined}>
          Browse
        </TabBtn>
        <TabBtn active={tab === "scan"} onClick={() => setTab("scan")}>
          Scan X
        </TabBtn>
        <TabBtn
          active={tab === "wallet"}
          onClick={() => setTab("wallet")}
          dot={walletReady ? "green" : "amber"}
        >
          Wallet
        </TabBtn>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 20px" }}>
        {tab === "browse" && <BrowseTab />}
        {tab === "scan" && <ScanTab />}
        {tab === "wallet" && <WalletTab />}
      </div>
    </div>
  );
}

function TabBtn({
  children,
  active,
  onClick,
  badge,
  dot,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
  dot?: "green" | "amber";
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 4px",
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid #22c55e" : "2px solid transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.4)",
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        transition: "color 0.15s",
        position: "relative",
      }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span style={{
          minWidth: 16, height: 16, padding: "0 4px",
          background: "#22c55e", color: "#000",
          fontSize: 10, fontWeight: 700,
          borderRadius: 10,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
          background: dot === "green" ? "#22c55e" : "#fbbf24",
        }} />
      )}
    </button>
  );
}
