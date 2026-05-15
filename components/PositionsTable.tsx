"use client";

import { useState } from "react";
import { Position } from "@/types";
import {
  calcPositionPnL, calcPositionPnLPct, calcPositionMarketValue,
  calcPositionWeight, fmt$, fmtPct, fmtShares,
} from "@/lib/calculations";

type SortKey = "ticker" | "value" | "weight" | "pnl" | "pnlPct" | "sector";

interface Props {
  positions: Position[];
  nav: number;
  showClosed?: boolean;
  onUpdated: () => void;
}

export default function PositionsTable({ positions, nav, showClosed = false, onUpdated }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = positions.filter((p) =>
    showClosed ? p.status === "closed" : p.status === "open"
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...filtered].sort((a, b) => {
    let va = 0, vb = 0;
    if (sortKey === "ticker") return sortAsc ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker);
    if (sortKey === "sector") return sortAsc ? (a.sector||"").localeCompare(b.sector||"") : (b.sector||"").localeCompare(a.sector||"");
    if (sortKey === "value") { va = calcPositionMarketValue(a); vb = calcPositionMarketValue(b); }
    if (sortKey === "weight") { va = calcPositionWeight(a, nav); vb = calcPositionWeight(b, nav); }
    if (sortKey === "pnl") { va = calcPositionPnL(a); vb = calcPositionPnL(b); }
    if (sortKey === "pnlPct") { va = calcPositionPnLPct(a); vb = calcPositionPnLPct(b); }
    return sortAsc ? va - vb : vb - va;
  });

  async function closePos(id: string, ticker: string) {
    if (!confirm(`Close ${ticker}? This will be logged as a closed trade.`)) return;
    await fetch(`/api/positions/${id}`, { method: "DELETE" });
    onUpdated();
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        className={`pb-3 pr-4 text-right cursor-pointer select-none hover:text-zinc-200 transition-colors ${active ? "text-white" : "text-zinc-500"}`}
        onClick={() => toggleSort(col)}>
        {label} {active ? (sortAsc ? "↑" : "↓") : ""}
      </th>
    );
  }

  if (!sorted.length) {
    return (
      <div className="text-center py-12 text-zinc-500 text-sm">
        {showClosed ? "No closed positions." : "No open positions — place your first trade above."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider border-b border-zinc-800">
            <th className={`pb-3 pr-4 cursor-pointer select-none hover:text-zinc-200 transition-colors ${sortKey === "ticker" ? "text-white" : "text-zinc-500"}`}
              onClick={() => toggleSort("ticker")}>
              Ticker {sortKey === "ticker" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            <th className="pb-3 pr-4 text-zinc-500">Dir</th>
            <th className="pb-3 pr-4 text-right text-zinc-500">Shares</th>
            <th className="pb-3 pr-4 text-right text-zinc-500">Entry</th>
            <th className="pb-3 pr-4 text-right text-zinc-500">Current</th>
            <Th col="value" label="Mkt Value" />
            <Th col="weight" label="Weight" />
            <Th col="pnl" label="Unrlzd P&L" />
            <Th col="pnlPct" label="Return" />
            <th className={`pb-3 pr-4 cursor-pointer select-none hover:text-zinc-200 transition-colors ${sortKey === "sector" ? "text-white" : "text-zinc-500"}`}
              onClick={() => toggleSort("sector")}>
              Sector {sortKey === "sector" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            {!showClosed && <th className="pb-3 text-zinc-500">Analyst</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/40">
          {sorted.map((p) => {
            const pnl = calcPositionPnL(p);
            const pnlPct = calcPositionPnLPct(p);
            const value = calcPositionMarketValue(p);
            const weight = calcPositionWeight(p, nav);
            const green = pnl >= 0;

            return (
              <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors group">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-white">{p.ticker}</span>
                    {!showClosed && (
                      <a href={`/trade`} className="opacity-0 group-hover:opacity-100 text-xs text-zinc-500 hover:text-blue-400 transition-all">trade</a>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    p.direction === "L"
                      ? "bg-emerald-900/40 text-emerald-400"
                      : "bg-red-900/40 text-red-400"
                  }`}>
                    {p.direction === "L" ? "LONG" : "SHORT"}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right font-mono text-zinc-300">{fmtShares(p.shares)}</td>
                <td className="py-3 pr-4 text-right font-mono text-zinc-400">{fmt$(p.entryPrice, 2)}</td>
                <td className="py-3 pr-4 text-right font-mono text-white">
                  {p.currentPrice > 0 ? fmt$(p.currentPrice, 2) : <span className="text-zinc-600">—</span>}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-zinc-200">{fmt$(value, 0)}</td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-zinc-300 text-xs">{weight.toFixed(2)}%</span>
                    <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(weight * 3, 100)}%` }} />
                    </div>
                  </div>
                </td>
                <td className={`py-3 pr-4 text-right font-mono font-medium ${green ? "text-emerald-400" : "text-red-400"}`}>
                  {pnl !== 0 ? fmt$(pnl, 0) : "—"}
                </td>
                <td className={`py-3 pr-4 text-right font-mono font-medium ${green ? "text-emerald-400" : "text-red-400"}`}>
                  {pnlPct !== 0 ? fmtPct(pnlPct) : "—"}
                </td>
                <td className="py-3 pr-4 text-zinc-400 text-xs">{p.sector || "—"}</td>
                {!showClosed && (
                  <td className="py-3">
                    <span className="text-zinc-400 text-xs">{p.analyst || "—"}</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
