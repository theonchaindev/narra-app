"use client";

import { useEffect, useState } from "react";
import { useNarraWallet } from "@/context/WalletContext";
import { shortenAddress, qrUrl, MIN_LAUNCH_SOL, TX_FEE_SOL } from "@/lib/clientWallet";

type Tab = "deposit" | "withdraw" | "settings";

export function WalletModal() {
  const {
    publicKey, balance, canLaunch, loading, walletOpen, closeWallet,
    refresh, exportPrivateKey, importKey, reset, withdraw,
  } = useNarraWallet();

  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [tab, setTab] = useState<Tab>("deposit");

  // Withdraw
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawTx, setWithdrawTx] = useState("");

  // Settings
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [privKeyCopied, setPrivKeyCopied] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importError, setImportError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (walletOpen) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    } else {
      setAnimating(false);
      const t = setTimeout(() => { setVisible(false); setTab("deposit"); }, 300);
      return () => clearTimeout(t);
    }
  }, [walletOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeWallet(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeWallet]);

  if (!visible) return null;

  const privateKey = exportPrivateKey();
  const maxSend = Math.max(0, balance - TX_FEE_SOL);
  const needed = Math.max(0, MIN_LAUNCH_SOL - balance);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function copyAddress() {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyPrivKey() {
    if (!privateKey) return;
    navigator.clipboard.writeText(privateKey);
    setPrivKeyCopied(true);
    setTimeout(() => setPrivKeyCopied(false), 2000);
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawTx("");
    const amount = parseFloat(withdrawAmount);
    if (!withdrawTo.trim() || isNaN(amount) || amount <= 0) { setWithdrawError("Enter a valid address and amount."); return; }
    if (amount > maxSend) { setWithdrawError(`Max ${maxSend.toFixed(4)} SOL`); return; }
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

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImportError("");
    try {
      await importKey(importInput.trim());
      setImportInput("");
    } catch {
      setImportError("Invalid private key.");
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${animating ? "opacity-100" : "opacity-0"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeWallet} />

      {/* Modal */}
      <div className={`relative z-10 w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${animating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"}`}>

        {/* Balance header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/35 mb-1">
                {publicKey ? shortenAddress(publicKey) : "Loading..."}
              </p>
              <p className="text-4xl font-bold font-mono tracking-tight">
                {loading ? "—" : balance.toFixed(4)}
                <span className="text-lg text-white/35 ml-2 font-normal">SOL</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-white/30 hover:text-white/60 rounded-xl hover:bg-white/5 transition-colors"
              >
                <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={closeWallet} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status pill */}
          <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
            canLaunch ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${canLaunch ? "bg-green-400" : "bg-yellow-400"}`} />
            {canLaunch ? "Ready to launch" : `${needed.toFixed(3)} SOL to launch`}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-5 mb-4 p-1 bg-white/5 rounded-xl">
          {(["deposit", "withdraw", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                tab === t ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 pb-5">
          {/* Deposit */}
          {tab === "deposit" && (
            <div className="space-y-3">
              <div className="flex justify-center py-2">
                <img src={qrUrl(publicKey ?? "")} alt="QR" className="w-40 h-40 rounded-2xl" />
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                <span className="flex-1 font-mono text-xs text-white/55 truncate">{publicKey}</span>
                <button
                  onClick={copyAddress}
                  className="shrink-0 px-2.5 py-1 text-xs bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="text-center text-xs text-white/25">Send SOL to this address to fund launches</p>
            </div>
          )}

          {/* Withdraw */}
          {tab === "withdraw" && (
            <form onSubmit={handleWithdraw} className="space-y-3">
              {withdrawTx ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                  <p className="text-green-400 font-semibold mb-1">Sent!</p>
                  <a href={`https://solscan.io/tx/${withdrawTx}`} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-mono text-green-400/60 hover:text-green-400 underline break-all">
                    {withdrawTx.slice(0, 28)}...
                  </a>
                  <button type="button" onClick={() => setWithdrawTx("")} className="block w-full mt-3 text-xs text-white/40 hover:text-white/70">
                    Send another
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Destination address</label>
                    <input
                      type="text"
                      value={withdrawTo}
                      onChange={e => setWithdrawTo(e.target.value)}
                      placeholder="Solana wallet address"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Amount (SOL)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.001"
                        min="0"
                        max={maxSend}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
                      />
                      <button type="button" onClick={() => setWithdrawAmount(maxSend.toFixed(4))}
                        className="px-3 py-2 text-xs border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:border-white/20 transition-colors">
                        Max
                      </button>
                    </div>
                    <p className="text-[10px] text-white/25 mt-1.5">Available: {maxSend.toFixed(4)} SOL</p>
                  </div>
                  {withdrawError && <p className="text-xs text-red-400">{withdrawError}</p>}
                  <button type="submit"
                    disabled={withdrawing || !withdrawTo.trim() || !withdrawAmount || balance <= TX_FEE_SOL}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    {withdrawing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : "Send SOL"}
                  </button>
                </>
              )}
            </form>
          )}

          {/* Settings */}
          {tab === "settings" && (
            <div className="space-y-2.5">
              {/* Private key */}
              <div className="bg-white/5 border border-white/8 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium">Private Key</p>
                  {privateKey && (
                    <button onClick={() => setShowPrivKey(!showPrivKey)}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors">
                      {showPrivKey ? "Hide" : "Reveal"}
                    </button>
                  )}
                </div>
                {showPrivKey && privateKey ? (
                  <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-2.5">
                    <p className="text-[10px] text-red-400 mb-1.5">⚠ Never share this</p>
                    <div className="flex items-start gap-2">
                      <code className="flex-1 text-[10px] font-mono text-white/50 break-all">{privateKey}</code>
                      <button onClick={copyPrivKey}
                        className="shrink-0 px-2 py-0.5 text-[10px] border border-white/10 rounded text-white/40 hover:text-white/70 transition-colors">
                        {privKeyCopied ? "✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-white/30">Reveal to export your wallet key.</p>
                )}
              </div>

              {/* Import */}
              <div className="bg-white/5 border border-white/8 rounded-2xl p-3.5">
                <p className="text-xs font-medium mb-2">Import Wallet</p>
                <form onSubmit={handleImport} className="flex gap-2">
                  <input
                    type="password"
                    value={importInput}
                    onChange={e => setImportInput(e.target.value)}
                    placeholder="Paste base58 private key"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/25"
                  />
                  <button type="submit" disabled={!importInput.trim()}
                    className="px-3 py-2 text-xs bg-white/10 hover:bg-white/15 disabled:opacity-40 border border-white/10 rounded-xl font-medium transition-colors">
                    Import
                  </button>
                </form>
                {importError && <p className="text-xs text-red-400 mt-1.5">{importError}</p>}
              </div>

              {/* Reset */}
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)}
                  className="w-full py-2 text-xs text-white/25 hover:text-red-400 border border-white/8 hover:border-red-500/20 rounded-xl transition-colors">
                  Generate new wallet
                </button>
              ) : (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-3.5">
                  <p className="text-xs text-red-300 mb-2">Export your key first — this cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmReset(false)}
                      className="flex-1 py-2 text-xs border border-white/10 rounded-xl text-white/50 hover:text-white/80 transition-colors">
                      Cancel
                    </button>
                    <button onClick={async () => { await reset(); setConfirmReset(false); }}
                      className="flex-1 py-2 text-xs bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-colors">
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
