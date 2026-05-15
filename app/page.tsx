"use client";

import { useEffect, useState, useCallback } from "react";
import { Position, PriceMap } from "@/types";
import {
  enrichWithPrices, calcPortfolioStats, calcSectorAllocations,
  calcPositionPnL, fmt$, fmtPct, fmtNum,
} from "@/lib/calculations";
import { PortfolioMetrics } from "@/lib/metrics";
import PositionsTable from "@/components/PositionsTable";
import ExposureChart from "@/components/charts/ExposureChart";
import SectorChart from "@/components/charts/SectorChart";
import PnLContributionChart from "@/components/charts/PnLContributionChart";
import SectorAttributionChart from "@/components/charts/SectorAttributionChart";
import RiskReturnChart from "@/components/charts/RiskReturnChart";

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-xl font-bold font-mono ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "risk" | "attribution">("overview");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [posRes, priceRes, cashRes] = await Promise.all([
        fetch("/api/positions"),
        fetch("/api/prices"),
        fetch("/api/cash"),
      ]);
      const raw: Position[] = await posRes.json();
      const prices: PriceMap = await priceRes.json();
      const { cash } = await cashRes.json();
      setPositions(enrichWithPrices(raw, prices));
      setCashBalance(cash);
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch beta/metrics separately (slower, 10s refresh)
  const refreshMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics");
      if (res.ok) setMetrics(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    refresh();
    refreshMetrics();
    const priceInterval = setInterval(() => refresh(true), 60_000);
    const metricsInterval = setInterval(refreshMetrics, 300_000);
    return () => { clearInterval(priceInterval); clearInterval(metricsInterval); };
  }, [refresh, refreshMetrics]);

  const open = positions.filter((p) => p.status === "open");
  const stats = calcPortfolioStats(positions, cashBalance);
  const sectors = calcSectorAllocations(positions, stats.nav);
  const nav = stats.nav;

  const topHoldings = [...open].sort((a, b) => b.currentPrice * b.shares - a.currentPrice * a.shares).slice(0, 5);
  const topPerformers = [...open].filter((p) => p.currentPrice > 0).sort((a, b) => {
    const ra = (a.currentPrice - a.entryPrice) / a.entryPrice * (a.direction === "L" ? 1 : -1);
    const rb = (b.currentPrice - b.entryPrice) / b.entryPrice * (b.direction === "L" ? 1 : -1);
    return rb - ra;
  }).slice(0, 3);
  const worstPerformers = [...topPerformers].reverse().slice(0, 3);

  // HF metrics derivations
  const top5Weight = topHoldings.reduce((s, p) => s + (p.currentPrice * p.shares / nav) * 100, 0);
  const daysOpen = Math.floor((Date.now() - new Date("2026-01-01").getTime()) / 86400000);
  const spyReturn = metrics ? ((metrics.spyPrice - metrics.spyInceptionPrice) / metrics.spyInceptionPrice) * 100 : null;
  const alphaVsSpy = spyReturn !== null ? stats.inceptionReturnPct - spyReturn : null;
  const totalPnL = open.reduce((s, p) => s + calcPositionPnL(p), 0);
  const winners = open.filter((p) => calcPositionPnL(p) > 0).length;
  const winRate = open.length > 0 ? (winners / open.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── NAV Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl font-bold font-mono text-white">{fmt$(nav, 2)}</h1>
            <span className={`text-base font-mono font-semibold ${stats.inceptionReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmtPct(stats.inceptionReturnPct)} inception
            </span>
            {alphaVsSpy !== null && (
              <span className={`text-sm font-mono ${alphaVsSpy >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                {alphaVsSpy >= 0 ? "+" : ""}{alphaVsSpy.toFixed(2)}% vs SPY
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            NAV · Baseline {fmt$(stats.openingNav, 0)} on 01 Jan 2026 · Day {daysOpen}
            {lastUpdated && ` · ${lastUpdated}`}
          </p>
        </div>
        <a href="/trade" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          + Place Trade
        </a>
      </div>

      {/* ── Primary Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Unrealized P&L" value={fmt$(stats.totalUnrealizedPnL, 0)} sub={fmtPct(stats.totalUnrealizedPnLPct)}
          color={totalPnL >= 0 ? "text-emerald-400" : "text-red-400"} />
        <Metric label="Net Exposure" value={fmtNum(stats.netExposurePct, 1) + "%"}
          sub={`${fmt$(stats.netExposure, 0)} · ${stats.netExposure >= 0 ? "net long" : "net short"}`}
          color={stats.netExposure >= 0 ? "text-emerald-400" : "text-red-400"} />
        <Metric label="Portfolio Beta" value={metrics ? metrics.portfolioBeta.toFixed(2) : "—"}
          sub="vs SPY · mkt-cap weighted" />
        <Metric label="Cash Balance" value={fmt$(stats.cashBalance, 0)}
          sub={`${fmtNum(stats.cashPct, 1)}% of NAV`} color="text-violet-400" />
      </div>

      {/* ── Secondary Metrics Row ── */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {[
          { l: "Gross Exp", v: fmt$(stats.grossExposure, 0) },
          { l: "Long Exp", v: fmt$(stats.totalLongValue, 0) },
          { l: "Short Exp", v: fmt$(stats.totalShortValue, 0) },
          { l: "L/S Ratio", v: stats.longShortRatio > 0 ? `${stats.longShortRatio.toFixed(2)}x` : "L-only" },
          { l: "# Positions", v: stats.openPositions.toString() },
          { l: "Top-5 Conc.", v: `${top5Weight.toFixed(1)}%` },
          { l: "Win Rate", v: `${winRate.toFixed(0)}%` },
          { l: "SPY Return", v: spyReturn !== null ? fmtPct(spyReturn) : "—" },
        ].map((m) => (
          <div key={m.l} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5">
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">{m.l}</p>
            <p className="font-mono font-semibold text-white text-xs">{m.v}</p>
          </div>
        ))}
      </div>

      {/* ── Tab Selector ── */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(["overview", "risk", "attribution"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === t ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-white"
            }`}>
            {t === "overview" ? "Overview" : t === "risk" ? "Risk & Beta" : "Attribution"}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Exposure Breakdown</p>
              <ExposureChart longValue={stats.totalLongValue} shortValue={stats.totalShortValue}
                netExposure={stats.netExposure} cashBalance={stats.cashBalance} />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Sector Allocation</p>
              <SectorChart data={sectors} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Top Performers</p>
              <div className="space-y-3">
                {topPerformers.map((p) => {
                  const ret = (p.currentPrice - p.entryPrice) / p.entryPrice * 100 * (p.direction === "L" ? 1 : -1);
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-4 ${p.direction === "L" ? "text-emerald-500" : "text-red-500"}`}>{p.direction}</span>
                        <span className="font-mono text-sm text-white">{p.ticker}</span>
                        <span className="text-xs text-zinc-600">{p.sector?.split(" ")[0]}</span>
                      </div>
                      <span className="font-mono text-sm text-emerald-400 font-semibold">{fmtPct(ret)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Laggards</p>
              <div className="space-y-3">
                {[...worstPerformers].reverse().map((p) => {
                  const ret = (p.currentPrice - p.entryPrice) / p.entryPrice * 100 * (p.direction === "L" ? 1 : -1);
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-4 ${p.direction === "L" ? "text-emerald-500" : "text-red-500"}`}>{p.direction}</span>
                        <span className="font-mono text-sm text-white">{p.ticker}</span>
                        <span className="text-xs text-zinc-600">{p.sector?.split(" ")[0]}</span>
                      </div>
                      <span className="font-mono text-sm text-red-400 font-semibold">{fmtPct(ret)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Largest Positions</p>
              <div className="space-y-3">
                {topHoldings.map((p) => {
                  const w = (p.currentPrice * p.shares / nav) * 100;
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm text-white">{p.ticker}</span>
                        <span className="font-mono text-xs text-zinc-400">{w.toFixed(2)}%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-800 rounded-full">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(w * 5, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Risk & Beta Tab ── */}
      {activeTab === "risk" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Portfolio Beta" value={metrics ? metrics.portfolioBeta.toFixed(3) : "—"}
              sub="Market-cap weighted vs SPY" />
            <Metric label="Net Exposure" value={fmtNum(stats.netExposurePct, 1) + "%"}
              sub="(Long − Short) / NAV" color={stats.netExposurePct >= 0 ? "text-emerald-400" : "text-red-400"} />
            <Metric label="Gross Leverage" value={nav > 0 ? fmtNum(stats.grossExposure / nav * 100, 1) + "%" : "—"}
              sub="(Long + Short) / NAV" />
            <Metric label="Cash Buffer" value={fmtNum(stats.cashPct, 1) + "%"} sub={fmt$(stats.cashBalance, 0)} color="text-violet-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Individual betas table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Position Betas</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="pb-2 pr-4">Ticker</th>
                      <th className="pb-2 pr-4">Beta</th>
                      <th className="pb-2 pr-4 text-right">Weight</th>
                      <th className="pb-2 text-right">Beta Contrib.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {open.filter((p) => p.currentPrice > 0).sort((a, b) => b.currentPrice * b.shares - a.currentPrice * a.shares).map((p) => {
                      const b = metrics?.betas[p.ticker] ?? null;
                      const w = (p.currentPrice * p.shares / nav) * 100;
                      const contrib = b !== null ? b * (w / 100) * (p.direction === "S" ? -1 : 1) : null;
                      return (
                        <tr key={p.id} className="hover:bg-zinc-800/20">
                          <td className="py-2 pr-4 font-mono text-white">{p.ticker}</td>
                          <td className="py-2 pr-4 font-mono text-zinc-300">{b !== null ? b.toFixed(2) : "—"}</td>
                          <td className="py-2 pr-4 text-right font-mono text-zinc-400">{w.toFixed(2)}%</td>
                          <td className={`py-2 text-right font-mono text-xs ${contrib !== null ? (contrib >= 0 ? "text-emerald-400" : "text-red-400") : "text-zinc-600"}`}>
                            {contrib !== null ? (contrib >= 0 ? "+" : "") + contrib.toFixed(3) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk/Return scatter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Risk / Return</p>
              <p className="text-[10px] text-zinc-600 mb-4">Bubble size = portfolio weight · Hover for details</p>
              <RiskReturnChart positions={positions} nav={nav} />
            </div>
          </div>
        </>
      )}

      {/* ── Attribution Tab ── */}
      {activeTab === "attribution" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">P&L Attribution by Position</p>
            <p className="text-[10px] text-zinc-600 mb-4">Unrealized P&L contribution per holding</p>
            <PnLContributionChart positions={positions} />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">P&L Attribution by Sector</p>
            <p className="text-[10px] text-zinc-600 mb-4">Which sectors are driving returns</p>
            <SectorAttributionChart positions={positions} />
          </div>

          {/* Attribution summary table */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Position Attribution Detail</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                    <th className="pb-2 pr-4">Ticker</th>
                    <th className="pb-2 pr-4">Sector</th>
                    <th className="pb-2 pr-4 text-right">Entry</th>
                    <th className="pb-2 pr-4 text-right">Current</th>
                    <th className="pb-2 pr-4 text-right">Return</th>
                    <th className="pb-2 pr-4 text-right">Weight</th>
                    <th className="pb-2 text-right">P&L $</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {[...open].sort((a, b) => Math.abs(calcPositionPnL(b)) - Math.abs(calcPositionPnL(a))).map((p) => {
                    const pnl = calcPositionPnL(p);
                    const ret = p.entryPrice > 0 ? (p.currentPrice - p.entryPrice) / p.entryPrice * 100 * (p.direction === "L" ? 1 : -1) : 0;
                    const w = nav > 0 ? (p.currentPrice * p.shares / nav) * 100 : 0;
                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/20">
                        <td className="py-2 pr-4 font-mono font-semibold text-white">{p.ticker}
                          <span className={`ml-1.5 text-[10px] font-bold ${p.direction === "L" ? "text-emerald-500" : "text-red-500"}`}>{p.direction}</span>
                        </td>
                        <td className="py-2 pr-4 text-zinc-400 text-xs">{p.sector || "—"}</td>
                        <td className="py-2 pr-4 text-right font-mono text-zinc-400">{fmt$(p.entryPrice, 2)}</td>
                        <td className="py-2 pr-4 text-right font-mono text-white">{p.currentPrice > 0 ? fmt$(p.currentPrice, 2) : "—"}</td>
                        <td className={`py-2 pr-4 text-right font-mono ${ret >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(ret)}</td>
                        <td className="py-2 pr-4 text-right font-mono text-zinc-400">{w.toFixed(2)}%</td>
                        <td className={`py-2 text-right font-mono font-semibold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt$(pnl, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Holdings Table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Holdings</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Click headers to sort · Live prices from Yahoo Finance</p>
          </div>
          <a href="/positions" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Full view →</a>
        </div>
        <PositionsTable positions={positions} nav={nav} onUpdated={refresh} />
      </div>
    </div>
  );
}
