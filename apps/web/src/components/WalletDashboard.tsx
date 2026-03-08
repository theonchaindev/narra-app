"use client";

import { useState, useEffect } from "react";
import { useNarraWallet } from "@/context/WalletContext";
import { shortenAddress, qrUrl, MIN_LAUNCH_SOL, TX_FEE_SOL } from "@/lib/clientWallet";

export function WalletDashboard() {
  const { publicKey, balance, canLaunch, loading, refresh, exportPrivateKey, importKey, reset, withdraw } =
    useNarraWallet();

  const [copied, setCopied] = useState(false);
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [privKeyCopied, setPrivKeyCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importError, setImportError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Withdraw state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawTx, setWithdrawTx] = useState("");

  // Refresh balance every 30s
  useEffect(() => {
    const id = setInterval(() => refresh(), 30_000);
    return () => clearInterval(id);
  }, [refresh]);

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
      setWithdrawError(`Max sendable is ${maxSend.toFixed(4)} SOL (keeping ${TX_FEE_SOL} SOL for fees).`);
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

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!publicKey) return null;

  const needed = Math.max(0, MIN_LAUNCH_SOL - balance);
  const fundedPct = Math.min(100, (balance / MIN_LAUNCH_SOL) * 100);
  const privateKey = exportPrivateKey();
  const maxSend = Math.max(0, balance - TX_FEE_SOL);

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Narra Wallet</h1>
      <p className="text-white/40 text-sm mb-8">Your built-in Solana wallet for launching tokens</p>

      {/* Status */}
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-6 text-sm font-medium border ${
          canLaunch
            ? "bg-green-500/10 border-green-500/25 text-green-400"
            : "bg-yellow-500/10 border-yellow-500/25 text-yellow-300"
        }`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${canLaunch ? "bg-green-400" : "bg-yellow-400"}`} />
        {canLaunch
          ? "Ready to launch — sufficient SOL balance"
          : `Needs ${needed.toFixed(3)} more SOL to launch`}
      </div>

      {/* Balance card */}
      <div className="bg-white/4 border border-white/10 rounded-2xl p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/35 mb-1">Balance</p>
            <p className="text-4xl font-bold font-mono">
              {balance.toFixed(4)}
              <span className="text-lg text-white/40 ml-2">SOL</span>
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 text-white/30 hover:text-white/60 border border-white/10 rounded-lg transition-colors"
            title="Refresh balance"
          >
            <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${canLaunch ? "bg-green-400" : "bg-yellow-400"}`}
            style={{ width: `${fundedPct}%` }}
          />
        </div>
        <p className="text-xs text-white/30">
          {canLaunch ? `Minimum ${MIN_LAUNCH_SOL} SOL reached ✓` : `${MIN_LAUNCH_SOL} SOL needed to launch tokens`}
        </p>
      </div>

      {/* Withdraw */}
      <div className="bg-white/4 border border-white/10 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Withdraw SOL</p>
            <p className="text-xs text-white/35">Send SOL to any Solana address</p>
          </div>
          <button
            onClick={() => { setShowWithdraw(!showWithdraw); setWithdrawError(""); setWithdrawTx(""); }}
            className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/50 hover:text-white/80 transition-colors shrink-0 ml-4"
          >
            {showWithdraw ? "Cancel" : "Withdraw"}
          </button>
        </div>

        {showWithdraw && (
          <form onSubmit={handleWithdraw} className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Destination address</label>
              <input
                type="text"
                value={withdrawTo}
                onChange={e => setWithdrawTo(e.target.value)}
                placeholder="Solana wallet address"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25"
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
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(maxSend.toFixed(4))}
                  className="px-3 py-2 text-xs border border-white/10 rounded-xl text-white/40 hover:text-white/70 transition-colors whitespace-nowrap"
                >
                  Max
                </button>
              </div>
              <p className="text-[10px] text-white/25 mt-1">Max: {maxSend.toFixed(4)} SOL (reserves {TX_FEE_SOL} SOL for fees)</p>
            </div>

            {withdrawError && <p className="text-xs text-red-400">{withdrawError}</p>}

            {withdrawTx && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <p className="text-xs text-green-400 font-medium mb-1">Sent successfully</p>
                <a
                  href={`https://solscan.io/tx/${withdrawTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-green-400/70 hover:text-green-400 break-all underline"
                >
                  {withdrawTx}
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={withdrawing || !withdrawTo.trim() || !withdrawAmount || balance <= TX_FEE_SOL}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {withdrawing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : "Send SOL"}
            </button>
          </form>
        )}
      </div>

      {/* Address + QR */}
      <div className="bg-white/4 border border-white/10 rounded-2xl p-5 mb-4">
        <p className="text-xs text-white/35 mb-4">Deposit address</p>
        <div className="flex justify-center mb-4">
          <img src={qrUrl(publicKey)} alt="Wallet QR code" className="w-44 h-44 rounded-xl" />
        </div>
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
          <span className="font-mono text-sm text-white/70 break-all">{publicKey}</span>
          <button
            onClick={copyAddress}
            className="ml-3 shrink-0 px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/50 hover:text-white/80 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-white/25 text-center mt-3">Send SOL here to fund token launches</p>
      </div>

      {/* Private key export */}
      <div className="bg-white/4 border border-white/10 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium">Private Key</p>
            <p className="text-xs text-white/35">Keep this secret — anyone with it controls your wallet</p>
          </div>
          {privateKey && (
            <button
              onClick={() => setShowPrivKey(!showPrivKey)}
              className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/50 hover:text-white/80 transition-colors shrink-0 ml-4"
            >
              {showPrivKey ? "Hide" : "Reveal"}
            </button>
          )}
        </div>

        {showPrivKey && privateKey && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs text-red-400 mb-2 font-medium">⚠ Never share this key</p>
            <div className="flex items-start gap-2">
              <code className="flex-1 text-xs font-mono text-white/60 break-all leading-relaxed">{privateKey}</code>
              <button
                onClick={copyPrivKey}
                className="shrink-0 px-2 py-1 text-xs border border-white/10 rounded-lg text-white/40 hover:text-white/70 transition-colors"
              >
                {privKeyCopied ? "✓" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {!privateKey && (
          <p className="text-xs text-white/30">No private key stored here yet. Import from your extension wallet below.</p>
        )}
      </div>

      {/* Import */}
      <div className="bg-white/4 border border-white/10 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Import wallet</p>
            <p className="text-xs text-white/35">Paste your private key from the extension to use the same wallet here</p>
          </div>
          <button
            onClick={() => { setShowImport(!showImport); setImportError(""); }}
            className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/50 hover:text-white/80 transition-colors shrink-0 ml-4"
          >
            {showImport ? "Cancel" : "Import"}
          </button>
        </div>

        {showImport && (
          <form onSubmit={handleImport} className="mt-4">
            <p className="text-xs text-white/40 mb-2">In your extension: Wallet tab → Export Private Key → copy the key → paste below</p>
            <input
              type="password"
              value={importInput}
              onChange={e => setImportInput(e.target.value)}
              placeholder="Paste base58 private key..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 mb-2"
            />
            {importError && <p className="text-xs text-red-400 mb-2">{importError}</p>}
            <button
              type="submit"
              disabled={!importInput.trim()}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 rounded-xl text-sm font-medium transition-colors"
            >
              Import & Replace
            </button>
          </form>
        )}
      </div>

      {/* Reset */}
      <div>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="w-full py-2.5 text-sm text-white/25 hover:text-white/50 border border-white/8 rounded-xl transition-colors"
          >
            Generate new wallet
          </button>
        ) : (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
            <p className="text-sm text-red-300 font-medium mb-1">Generate a new wallet?</p>
            <p className="text-xs text-red-300/60 mb-4">
              This replaces your current keypair. Make sure you&apos;ve exported your private key first — any SOL in this wallet will be inaccessible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-2 text-sm border border-white/10 rounded-xl text-white/50 hover:text-white/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 text-sm bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-colors"
              >
                Generate new
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
