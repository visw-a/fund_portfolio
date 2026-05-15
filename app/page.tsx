"use client";

import { useEffect, useState, useCallback } from "react";
import { Position, PriceMap } from "@/types";
import {
  enrichWithPrices, calcPortfolioStats, calcSectorAllocations,
  fmt$, fmtPct, fmtNum,
} from "@/lib/calculations";
import PositionsTable from "@/components/PositionsTable";
import ExposureChart from "@/components/charts/ExposureChart";
import SectorChart from "@/components/charts/SectorChart";

function MetricBlock({
  label, value, sub, color, border,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  border?: string;
}) {
  return (
    <div className={`bg-zinc-900 rounded-xl p-5 border ${border ?? "border-zinc-800"}`}>
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setPriceLoading(true);
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
      console.error("Failed to load portfolio", err);
    } finally {
      setLoading(false);
      setPriceLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => refresh(true), 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const open = positions.filter((p) => p.status === "open");
  const stats = calcPortfolioStats(positions, cashBalance);
  const sectors = calcSectorAllocations(positions, stats.nav);
  const nav = stats.nav;

  const topHoldings = [...open]
    .sort((a, b) => (b.currentPrice * b.shares) - (a.currentPrice * a.shares))
    .slice(0, 5);

  const topPerformers = [...open]
    .filter((p) => p.currentPrice > 0 && p.entryPrice > 0)
    .sort((a, b) => {
      const ra = (a.currentPrice - a.entryPrice) / a.entryPrice * (a.direction === "L" ? 1 : -1);
      const rb = (b.currentPrice - b.entryPrice) / b.entryPrice * (b.direction === "L" ? 1 : -1);
      return rb - ra;
    })
    .slice(0, 3);

  const worstPerformers = [...open]
    .filter((p) => p.currentPrice > 0 && p.entryPrice > 0)
    .sort((a, b) => {
      const ra = (a.currentPrice - a.entryPrice) / a.entryPrice * (a.direction === "L" ? 1 : -1);
      const rb = (b.currentPrice - b.entryPrice) / b.entryPrice * (b.direction === "L" ? 1 : -1);
      return ra - rb;
    })
    .slice(0, 3);

  const navPositive = stats.inceptionReturn >= 0;
  const pnlPositive = stats.totalUnrealizedPnL >= 0;

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
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl font-bold font-mono text-white">{fmt$(nav, 2)}</h1>
            <span className={`text-lg font-mono font-semibold ${navPositive ? "text-emerald-400" : "text-red-400"}`}>
              {fmtPct(stats.inceptionReturnPct)} since inception
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Portfolio NAV · Base {fmt$(stats.openingNav, 0)} on 01 Jan 2026
            {lastUpdated && ` · Prices as of ${lastUpdated}`}
            {priceLoading && " · refreshing..."}
          </p>
        </div>
        <a href="/trade"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          + Place Trade
        </a>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricBlock
          label="Unrealized P&L"
          value={fmt$(stats.totalUnrealizedPnL, 0)}
          sub={fmtPct(stats.totalUnrealizedPnLPct)}
          color={pnlPositive ? "text-emerald-400" : "text-red-400"}
          border={pnlPositive ? "border-emerald-900/50" : "border-red-900/50"}
        />
        <MetricBlock
          label="Gross Exposure"
          value={fmt$(stats.grossExposure, 0)}
          sub={`${stats.openPositions} open positions`}
        />
        <MetricBlock
          label="Net Exposure"
          value={fmtNum(stats.netExposurePct, 1) + "%"}
          sub={`${fmt$(stats.netExposure, 0)} · ${stats.netExposure >= 0 ? "net long" : "net short"}`}
          color={stats.netExposure >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <MetricBlock
          label="Cash Balance"
          value={fmt$(stats.cashBalance, 0)}
          sub={`${fmtNum(stats.cashPct, 1)}% of NAV`}
          color="text-violet-400"
        />
      </div>

      {/* ── Secondary Metrics ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Long Positions",  value: stats.longCount.toString() },
          { label: "Short Positions", value: stats.shortCount.toString() },
          { label: "L/S Ratio",       value: stats.longShortRatio > 0 ? `${stats.longShortRatio.toFixed(2)}x` : "—" },
          { label: "Long Exposure",   value: fmt$(stats.totalLongValue, 0) },
          { label: "Short Exposure",  value: fmt$(stats.totalShortValue, 0) },
          { label: "Inception Δ",     value: fmt$(stats.inceptionReturn, 0),
          },
        ].map((m) => (
          <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{m.label}</p>
            <p className="font-mono font-semibold text-white text-sm">{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Exposure Breakdown</p>
          <ExposureChart
            longValue={stats.totalLongValue}
            shortValue={stats.totalShortValue}
            netExposure={stats.netExposure}
            cashBalance={stats.cashBalance}
          />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Sector Allocation</p>
          <SectorChart data={sectors} />
        </div>
      </div>

      {/* ── Performers + Top Holdings ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top performers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Top Performers</p>
          <div className="space-y-3">
            {topPerformers.map((p) => {
              const ret = (p.currentPrice - p.entryPrice) / p.entryPrice * 100 * (p.direction === "L" ? 1 : -1);
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-4 ${p.direction === "L" ? "text-emerald-500" : "text-red-500"}`}>{p.direction}</span>
                    <span className="font-mono text-sm font-semibold text-white">{p.ticker}</span>
                  </div>
                  <span className="font-mono text-sm text-emerald-400 font-semibold">{fmtPct(ret)}</span>
                </div>
              );
            })}
            {topPerformers.length === 0 && <p className="text-xs text-zinc-600">No price data yet</p>}
          </div>
        </div>

        {/* Worst performers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Laggards</p>
          <div className="space-y-3">
            {worstPerformers.map((p) => {
              const ret = (p.currentPrice - p.entryPrice) / p.entryPrice * 100 * (p.direction === "L" ? 1 : -1);
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-4 ${p.direction === "L" ? "text-emerald-500" : "text-red-500"}`}>{p.direction}</span>
                    <span className="font-mono text-sm font-semibold text-white">{p.ticker}</span>
                  </div>
                  <span className="font-mono text-sm text-red-400 font-semibold">{fmtPct(ret)}</span>
                </div>
              );
            })}
            {worstPerformers.length === 0 && <p className="text-xs text-zinc-600">No price data yet</p>}
          </div>
        </div>

        {/* Top holdings by weight */}
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
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(w * 5, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Positions Table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Holdings</p>
            <p className="text-xs text-zinc-600 mt-0.5">Click column headers to sort · All prices live from Yahoo Finance</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500">{open.length} open</span>
            <a href="/positions" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</a>
          </div>
        </div>
        <PositionsTable positions={positions} nav={nav} onUpdated={refresh} />
      </div>
    </div>
  );
}
