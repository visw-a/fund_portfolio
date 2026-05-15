"use client";

import { useEffect, useState, useCallback } from "react";
import { Position, PriceMap } from "@/types";
import { enrichWithPrices, calcPortfolioStats, fmt$, fmtPct, fmtNum } from "@/lib/calculations";

type TradeAction = "BUY" | "SELL" | "SHORT" | "COVER";

const ACTION_COLORS: Record<TradeAction, string> = {
  BUY:   "bg-emerald-600 border-emerald-600 text-white",
  SELL:  "bg-red-600 border-red-600 text-white",
  SHORT: "bg-amber-600 border-amber-600 text-white",
  COVER: "bg-blue-600 border-blue-600 text-white",
};

const ACTION_DESCRIPTIONS: Record<TradeAction, string> = {
  BUY:   "Open or increase a long position",
  SELL:  "Reduce or close a long position",
  SHORT: "Open or increase a short position",
  COVER: "Reduce or close a short position",
};

export default function TradePage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [prices, setPrices] = useState<PriceMap>({});
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState<TradeAction>("BUY");
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [sector, setSector] = useState("Information Technology");
  const [analyst, setAnalyst] = useState("");
  const [thesis, setThesis] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [review, setReview] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [posRes, priceRes, cashRes] = await Promise.all([
      fetch("/api/positions"),
      fetch("/api/prices"),
      fetch("/api/cash"),
    ]);
    const raw: Position[] = await posRes.json();
    const px: PriceMap = await priceRes.json();
    const { cash } = await cashRes.json();
    setPositions(enrichWithPrices(raw, px));
    setPrices(px);
    setCashBalance(cash);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-fill price when ticker changes and we have a live quote
  useEffect(() => {
    const t = ticker.toUpperCase().trim();
    if (prices[t]) setPrice(prices[t].toFixed(2));
  }, [ticker, prices]);

  const sharesNum = parseFloat(shares) || 0;
  const priceNum = parseFloat(price) || 0;
  const tradeValue = sharesNum * priceNum;

  const direction = action === "BUY" || action === "SELL" ? "L" : "S";
  const existingPos = positions.find(
    (p) => p.ticker === ticker.toUpperCase() && p.direction === direction && p.status === "open"
  );
  const currentPositionValue = existingPos ? existingPos.currentPrice * existingPos.shares : 0;
  const stats = calcPortfolioStats(positions, cashBalance);
  const nav = stats.nav;

  const isOpen = action === "BUY" || action === "SHORT";
  const newPositionValue = isOpen
    ? currentPositionValue + tradeValue
    : currentPositionValue - tradeValue;
  const currentWeight = nav > 0 ? (currentPositionValue / nav) * 100 : 0;
  const newWeight = nav > 0 ? (newPositionValue / nav) * 100 : 0;
  const cashAfter = action === "BUY" || action === "COVER"
    ? cashBalance - tradeValue
    : cashBalance + tradeValue;

  async function submitTrade() {
    setSubmitting(true);
    setFlash(null);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          action,
          shares: sharesNum,
          price: priceNum,
          date: new Date().toISOString().split("T")[0],
          sector,
          analyst,
          thesis,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Trade failed");

      setFlash({ type: "success", msg: `${action} ${fmtNum(sharesNum, 0)} ${ticker.toUpperCase()} @ ${fmt$(priceNum, 2)} executed successfully.` });
      setTicker(""); setShares(""); setPrice(""); setThesis(""); setNotes("");
      setReview(false);
      setConfirmed(false);
      refresh();
    } catch (err: unknown) {
      setFlash({ type: "error", msg: err instanceof Error ? err.message : "Trade failed" });
    } finally {
      setSubmitting(false);
    }
  }

  const canReview = ticker.trim() && sharesNum > 0 && priceNum > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Execution</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Place orders — all trades are logged to the blotter</p>
      </div>

      {flash && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          flash.type === "success"
            ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300"
            : "bg-red-900/40 border border-red-700 text-red-300"
        }`}>
          {flash.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Trade Ticket ── */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
          {/* Action Selector */}
          <div>
            <p className="label mb-2">Order Type</p>
            <div className="grid grid-cols-4 gap-2">
              {(["BUY", "SELL", "SHORT", "COVER"] as TradeAction[]).map((a) => (
                <button key={a}
                  onClick={() => { setAction(a); setReview(false); }}
                  className={`py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                    action === a ? ACTION_COLORS[a] : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                  }`}>
                  {a}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">{ACTION_DESCRIPTIONS[action]}</p>
          </div>

          {/* Ticker + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ticker Symbol</label>
              <div className="relative">
                <input
                  className="input uppercase pr-24"
                  placeholder="AAPL"
                  value={ticker}
                  onChange={(e) => { setTicker(e.target.value.toUpperCase()); setReview(false); }}
                />
                {prices[ticker.toUpperCase()] && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">
                    {fmt$(prices[ticker.toUpperCase()], 2)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="label">Price per Share (USD)</label>
              <input
                className="input font-mono"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setReview(false); }}
              />
            </div>
          </div>

          {/* Shares */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Number of Shares</label>
              <input
                className="input font-mono"
                type="number"
                step="0.01"
                placeholder="100"
                value={shares}
                onChange={(e) => { setShares(e.target.value); setReview(false); }}
              />
            </div>
            <div className="flex items-end">
              <div className="w-full bg-zinc-800 rounded-lg px-4 py-2.5">
                <p className="text-xs text-zinc-500 mb-0.5">Trade Value</p>
                <p className="font-mono font-bold text-white text-lg">{fmt$(tradeValue, 2)}</p>
              </div>
            </div>
          </div>

          {/* Only shown for new positions (BUY/SHORT) */}
          {isOpen && !existingPos && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Sector</label>
                  <select className="input" value={sector} onChange={(e) => setSector(e.target.value)}>
                    {["Communication Services","Consumer Discretionary","Consumer Staples","Energy","Financials","Health Care","Industrials","Information Technology","Materials","Real Estate","Utilities","Other"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Analyst</label>
                  <input className="input" placeholder="Your name" value={analyst} onChange={(e) => setAnalyst(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Investment Thesis</label>
                <textarea className="input h-20 resize-none" placeholder="Why are you entering this position?"
                  value={thesis} onChange={(e) => setThesis(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="e.g. Earnings catalyst, macro hedge, trimming on strength..."
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {/* Review / Submit */}
          {!review ? (
            <button
              disabled={!canReview}
              onClick={() => setReview(true)}
              className="w-full py-3 rounded-lg text-sm font-bold bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors">
              Review Order
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-zinc-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Order</span>
                  <span className="font-bold text-white">{action} {fmtNum(sharesNum, 0)} {ticker.toUpperCase()} @ {fmt$(priceNum, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Trade value</span>
                  <span className="font-mono text-white">{fmt$(tradeValue, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cash after trade</span>
                  <span className={`font-mono ${cashAfter < 0 ? "text-red-400" : "text-white"}`}>{fmt$(cashAfter, 2)}</span>
                </div>
                {cashAfter < 0 && (
                  <p className="text-red-400 text-xs">⚠ Insufficient cash balance</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <label htmlFor="confirm" className="text-sm text-zinc-300">
                  I confirm this order is accurate and authorized
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setReview(false); setConfirmed(false); }}
                  className="flex-1 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors">
                  Back
                </button>
                <button
                  disabled={!confirmed || submitting || cashAfter < 0}
                  onClick={submitTrade}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors ${
                    action === "BUY" ? "bg-emerald-600 hover:bg-emerald-500" :
                    action === "SELL" ? "bg-red-600 hover:bg-red-500" :
                    action === "SHORT" ? "bg-amber-600 hover:bg-amber-500" :
                    "bg-blue-600 hover:bg-blue-500"
                  }`}>
                  {submitting ? "Submitting..." : `Confirm ${action}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Order Preview Panel ── */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Order Preview</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Available Cash</span>
                <span className="font-mono text-white">{fmt$(cashBalance, 2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Portfolio NAV</span>
                <span className="font-mono text-white">{fmt$(nav, 0)}</span>
              </div>
              <div className="border-t border-zinc-800 pt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-400">{ticker.toUpperCase() || "—"} Current Weight</span>
                  <span className="font-mono text-zinc-300">{currentWeight.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">New Weight</span>
                  <span className={`font-mono font-semibold ${newWeight > currentWeight ? "text-blue-400" : "text-amber-400"}`}>
                    {canReview ? `${newWeight.toFixed(2)}%` : "—"}
                  </span>
                </div>
              </div>
              {existingPos && (
                <div className="border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500 mb-2">Existing position</p>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Shares held</span>
                    <span className="font-mono text-white">{fmtNum(existingPos.shares, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Entry price</span>
                    <span className="font-mono text-zinc-300">{fmt$(existingPos.entryPrice, 2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent positions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Open Positions</p>
            <div className="space-y-2">
              {loading ? (
                <p className="text-xs text-zinc-500 animate-pulse">Loading...</p>
              ) : positions.filter((p) => p.status === "open").slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-center font-bold rounded px-0.5 ${
                      p.direction === "L" ? "text-emerald-400" : "text-red-400"
                    }`}>{p.direction}</span>
                    <span className="font-mono text-white">{p.ticker}</span>
                  </div>
                  <span className="font-mono text-zinc-400">{fmtNum(p.shares, 2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
