"use client";

import { useEffect, useRef, useState } from "react";
import { useNarraWallet } from "@/context/WalletContext";
import { shortenAddress, qrUrl, MIN_LAUNCH_SOL, TX_FEE_SOL } from "@/lib/clientWallet";

export function WalletModal() {
  const {
    publicKey, balance, canLaunch, loading, walletOpen, closeWallet,
    refresh, exportPrivateKey, importKey, reset, withdraw,
  } = useNarraWallet();

  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle open/close animation
  useEffect(() => {
    if (walletOpen) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [walletOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeWallet(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeWallet]);

  const [copied, setCopied] = useState(false);
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [privKeyCopied, setPrivKeyCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importError, setImportError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawTx, setWithdrawTx] = useState("");

  function copyAddress() {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyPrivKey() {
    const pk = exportPrivateKey();
    if (!pk) return;
    navigator.clipboard.writeText(pk);
    setPrivKeyCopied(true);
    setTimeout(() => setPrivKeyCopied(false), 2000);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImportError("");
    try {
      await importKey(importInput.trim());
      setShowImport(false);
      setImportInput("");
    } catch {
      setImportError("Invalid private key — paste the base58 key from your extension wallet.");
    }
  }

  async function handleReset() {
    await reset();
    setShowReset(false);
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawTx("");
    const amount = parseFloat(withdrawAmount);
    if (!withdrawTo.trim() || isNaN(amount) || amount <= 0) {
      setWithdrawError("Enter a valid address and amount.");
      return;
    }
    const maxSend = Math.max(0, balance - TX_FEE_SOL);
    if (amount > maxSend) {
      setWithdrawError(`Max sendable is ${maxSend.toFixed(4)} SOL (keeping ${TX_FEE_SOL} for fees).`);
      return;
    }
    setWithdrawing(true);
    try {
      const sig = await withdraw(withdrawTo.trim(), amount);
      setWithdrawTx(sig);
      setWithdrawTo("");
      setWithdrawAmount("");
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : "Transaction failed.");
    } finally {
      setWithdrawing(false);
    }
  }

  if (!visible) return null;

  const privateKey = exportPrivateKey();
  const needed = Math.max(0, MIN_LAUNCH_SOL - balance);
  const fundedPct = Math.min(100, (balance / MIN_LAUNCH_SOL) * 100);
  const maxSend = Math.max(0, balance - TX_FEE_SOL);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 p-4 ${
        animating ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeWallet}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative z-10 w-full max-w-md bg-[#0d0d0d] border border-white/10 shadow-2xl rounded-2xl flex flex-col max-h-[90vh] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          animating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div>
            <h2 className="font-bold text-base">Narra Wallet</h2>
            <p className="text-xs text-white/35">Your Solana wallet for launching tokens</p>
          </div>
          <button
            onClick={closeWallet}
            className="p-2 rounded-xl text-white/35 hover:text-white hover:bg-white/8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : !publicKey ? null : (
            <>
              {/* Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                canLaunch
                  ? "bg-green-500/10 border-green-500/25 text-green-400"
                  : "bg-yellow-500/10 border-yellow-500/25 text-yellow-300"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${canLaunch ? "bg-green-400" : "bg-yellow-400"}`} />
                {canLaunch ? "Ready to launch" : `Needs ${needed.toFixed(3)} more SOL`}
              </div>

              {/* Balance */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-white/35 mb-0.5">Balance</p>
                    <p className="text-3xl font-bold font-mono">
                      {balance.toFixed(4)}
                      <span className="text-base text-white/40 ml-2">SOL</span>
                    </p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-1.5 text-white/30 hover:text-white/60 border border-white/10 rounded-lg transition-colors"
                  >
                    <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <div className="h-1 bg-white/8 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${canLaunch ? "bg-green-400" : "bg-yellow-400"}`}
                    style={{ width: `${fundedPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/25">
                  {canLaunch ? `Min ${MIN_LAUNCH_SOL} SOL reached ✓` : `${MIN_LAUNCH_SOL} SOL needed to launch`}
                </p>
              </div>

              {/* Withdraw */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Withdraw SOL</p>
                    <p className="text-xs text-white/35">Send to any Solana address</p>
                  </div>
                  <button
                    onClick={() => { setShowWithdraw(!showWithdraw); setWithdrawError(""); setWithdrawTx(""); }}
                    className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/50 hover:text-white/80 transition-colors shrink-0 ml-3"
                  >
                    {showWithdraw ? "Cancel" : "Withdraw"}
                  </button>
                </div>

                {showWithdraw && (
                  <form onSubmit={handleWithdraw} className="mt-3 space-y-2.5">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Destination</label>
                      <input
                        type="text"
                        value={withdrawTo}
                        onChange={e => setWithdrawTo(e.target.value)}
                        placeholder="Solana address"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Amount (SOL)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={e => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.001"
                          min="0"
                          max={maxSend}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25"
                        />
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(maxSend.toFixed(4))}
                          className="px-2.5 py-1.5 text-xs border border-white/10 rounded-xl text-white/40 hover:text-white/70 transition-colors"
                        >
                          Max
                        </button>
                      </div>
                      <p className="text-[10px] text-white/25 mt-1">Max: {maxSend.toFixed(4)} SOL (reserves {TX_FEE_SOL} for fees)</p>
                    </div>
                    {withdrawError && <p className="text-xs text-red-400">{withdrawError}</p>}
                    {withdrawTx && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2.5">
                        <p className="text-xs text-green-400 font-medium mb-1">Sent ✓</p>
                        <a
                          href={`https://solscan.io/tx/${withdrawTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-green-400/70 hover:text-green-400 break-all underline"
                        >
                          {withdrawTx.slice(0, 24)}...
                        </a>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={withdrawing || !withdrawTo.trim() || !withdrawAmount || balance <= TX_FEE_SOL}
                      className="w-full py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {withdrawing ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      ) : "Send SOL"}
                    </button>
                  </form>
                )}
              </div>

              {/* Deposit address */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <p className="text-xs text-white/35 mb-3">Deposit address</p>
                <div className="flex justify-center mb-3">
                  <img src={qrUrl(publicKey)} alt="QR" className="w-36 h-36 rounded-xl" />
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5">
                  <span className="font-mono text-xs text-white/60 break-all leading-relaxed">{publicKey}</span>
                  <button
                    onClick={copyAddress}
                    className="ml-2 shrink-0 px-2.5 py-1 text-xs border border-white/10 rounded-lg text-white/50 hover:text-white/80 transition-colors"
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Private key */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Private Key</p>
                    <p className="text-xs text-white/35">Never share this</p>
                  </div>
                  {privateKey && (
                    <button
                      onClick={() => setShowPrivKey(!showPrivKey)}
                      className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/50 hover:text-white/80 transition-colors shrink-0 ml-3"
                    >
                      {showPrivKey ? "Hide" : "Reveal"}
                    </button>
                  )}
                </div>
                {showPrivKey && privateKey && (
                  <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                    <p className="text-xs text-red-400 mb-2 font-medium">⚠ Never share this key</p>
                    <div className="flex items-start gap-2">
                      <code className="flex-1 text-xs font-mono text-white/55 break-all leading-relaxed">{privateKey}</code>
                      <button
                        onClick={copyPrivKey}
                        className="shrink-0 px-2 py-1 text-xs border border-white/10 rounded-lg text-white/40 hover:text-white/70 transition-colors"
                      >
                        {privKeyCopied ? "✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Import */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Import wallet</p>
                    <p className="text-xs text-white/35">Replace with another keypair</p>
                  </div>
                  <button
                    onClick={() => { setShowImport(!showImport); setImportError(""); }}
                    className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/50 hover:text-white/80 transition-colors shrink-0 ml-3"
                  >
                    {showImport ? "Cancel" : "Import"}
                  </button>
                </div>
                {showImport && (
                  <form onSubmit={handleImport} className="mt-3">
                    <input
                      type="password"
                      value={importInput}
                      onChange={e => setImportInput(e.target.value)}
                      placeholder="Paste base58 private key..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 mb-2"
                    />
                    {importError && <p className="text-xs text-red-400 mb-2">{importError}</p>}
                    <button
                      type="submit"
                      disabled={!importInput.trim()}
                      className="w-full py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 rounded-xl text-xs font-medium transition-colors"
                    >
                      Import & Replace
                    </button>
                  </form>
                )}
              </div>

              {/* Reset */}
              {!showReset ? (
                <button
                  onClick={() => setShowReset(true)}
                  className="w-full py-2.5 text-xs text-white/25 hover:text-white/50 border border-white/8 rounded-xl transition-colors"
                >
                  Generate new wallet
                </button>
              ) : (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-sm text-red-300 font-medium mb-1">Generate a new wallet?</p>
                  <p className="text-xs text-red-300/60 mb-3">This replaces your current keypair. Export your private key first.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReset(false)}
                      className="flex-1 py-2 text-xs border border-white/10 rounded-xl text-white/50 hover:text-white/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2 text-xs bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-colors"
                    >
                      Generate new
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
