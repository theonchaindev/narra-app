import React, { useEffect, useState } from "react";
import {
  getWalletInfo,
  getLegacyPrivateKey,
  shortenAddress,
  qrUrl,
  MIN_LAUNCH_SOL,
  type WalletInfo,
} from "../../lib/wallet";

const WEB_DASHBOARD = "http://localhost:3001/wallet";

export function WalletTab() {
  const [wallet, setWallet] = useState<WalletInfo | null | "loading">("loading");
  const [copied, setCopied] = useState(false);
  const [legacyKey, setLegacyKey] = useState<string | null>(null);
  const [legacyKeyCopied, setLegacyKeyCopied] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);

  async function load() {
    const info = await getWalletInfo();
    setWallet(info);
    // Check for old locally-stored key (migration path)
    const legacy = await getLegacyPrivateKey();
    setLegacyKey(legacy);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  function copyAddress() {
    if (!wallet || wallet === "loading") return;
    navigator.clipboard.writeText(wallet.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLegacyKey() {
    if (!legacyKey) return;
    navigator.clipboard.writeText(legacyKey);
    setLegacyKeyCopied(true);
    setTimeout(() => setLegacyKeyCopied(false), 2000);
  }

  function openDashboard() {
    chrome.tabs.create({ url: WEB_DASHBOARD });
  }

  if (wallet === "loading") {
    return (
      <div style={{ textAlign: "center", paddingTop: 40 }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading wallet...</p>
      </div>
    );
  }

  // No wallet configured — web app hasn't been opened yet
  if (wallet === null) {
    return (
      <div style={{ padding: "12px 0" }}>
        <div style={{
          ...card,
          textAlign: "center",
          padding: "24px 16px",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
            fontSize: 20,
          }}>
            🔑
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>No wallet yet</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>
            Open the Narra web app to create your wallet. It will automatically sync here.
          </p>
          <button onClick={openDashboard} style={btnPrimary}>
            Open Narra → Wallet
          </button>
        </div>

        {/* Legacy migration: old extension wallet exists */}
        {legacyKey && (
          <div style={{ ...card, marginTop: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#fcd34d", marginBottom: 4 }}>
              Previous wallet found
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 10, lineHeight: 1.5 }}>
              You have an old locally-generated wallet. Export the key and import it on the web to keep using the same address.
            </p>
            <button onClick={() => setShowLegacy(!showLegacy)} style={btnGhost}>
              {showLegacy ? "Hide key" : "Show private key"}
            </button>
            {showLegacy && (
              <div style={{ marginTop: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 8 }}>
                <p style={{ fontSize: 10, color: "#f87171", marginBottom: 6 }}>⚠ Keep this secret</p>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <code style={{ flex: 1, fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", wordBreak: "break-all", lineHeight: 1.5 }}>
                    {legacyKey}
                  </code>
                  <button onClick={copyLegacyKey} style={{ ...btnGhost, flexShrink: 0 }}>
                    {legacyKeyCopied ? "✓" : "Copy"}
                  </button>
                </div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                  Open Narra web → Wallet → Import to use this address on web
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const needed = Math.max(0, MIN_LAUNCH_SOL - wallet.balanceSol);
  const fundedPct = Math.min(100, (wallet.balanceSol / MIN_LAUNCH_SOL) * 100);

  return (
    <div>
      {/* Synced badge */}
      <div style={{
        padding: "7px 10px", borderRadius: 8, marginBottom: 10,
        background: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.25)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>Synced with web app</span>
        </div>
        <button onClick={openDashboard} style={btnLink}>Manage →</button>
      </div>

      {/* Balance */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>Balance</p>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>
              {wallet.balanceSol.toFixed(4)}
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>SOL</span>
            </p>
          </div>
          <button onClick={load} style={btnGhost} title="Refresh">↻</button>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginBottom: 5 }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: `${fundedPct}%`,
            background: wallet.canLaunch ? "#22c55e" : "#fbbf24",
            transition: "width 0.3s",
          }} />
        </div>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          {wallet.canLaunch
            ? `Ready — ${MIN_LAUNCH_SOL} SOL minimum reached ✓`
            : `Need ${needed.toFixed(3)} more SOL to launch`}
        </p>
      </div>

      {/* Address + QR */}
      <div style={{ ...card, marginTop: 8 }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Deposit address</p>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img
            src={qrUrl(wallet.publicKey)}
            alt="Wallet QR"
            style={{ width: 130, height: 130, borderRadius: 8 }}
          />
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "7px 10px",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
            {shortenAddress(wallet.publicKey)}
          </span>
          <button onClick={copyAddress} style={btnGhost}>{copied ? "✓" : "Copy"}</button>
        </div>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 8 }}>
          Send SOL here to fund your launches
        </p>
      </div>

      {/* Full dashboard link */}
      <button onClick={openDashboard} style={{
        width: "100%", marginTop: 10, padding: "8px",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 12,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Export key · Manage wallet
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

const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "rgba(255,255,255,0.5)",
  fontSize: 11,
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "3px 7px",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.85)",
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8,
  padding: "8px 16px",
  cursor: "pointer",
  width: "100%",
};

const btnLink: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.4)",
  fontSize: 11,
  cursor: "pointer",
  padding: 0,
};
