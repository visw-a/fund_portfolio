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

  const filtered = positions.filter((p) => showClosed ? p.status === "closed" : p.status === "open");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...filtered].sort((a, b) => {
    let va = 0, vb = 0;
    if (sortKey === "ticker") return sortAsc ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker);
    if (sortKey === "sector") return sortAsc ? (a.sector||"").localeCompare(b.sector||"") : (b.sector||"").localeCompare(a.sector||"");
    if (sortKey === "value")   { va = calcPositionMarketValue(a); vb = calcPositionMarketValue(b); }
    if (sortKey === "weight")  { va = calcPositionWeight(a, nav); vb = calcPositionWeight(b, nav); }
    if (sortKey === "pnl")     { va = calcPositionPnL(a); vb = calcPositionPnL(b); }
    if (sortKey === "pnlPct")  { va = calcPositionPnLPct(a); vb = calcPositionPnLPct(b); }
    return sortAsc ? va - vb : vb - va;
  });

  async function closePos(id: string, ticker: string) {
    if (!confirm(`Close ${ticker}? This will be recorded in the blotter.`)) return;
    await fetch(`/api/positions/${id}`, { method: "DELETE" });
    onUpdated();
  }

  const thStyle = (col: SortKey): React.CSSProperties => ({
    cursor: "pointer",
    userSelect: "none",
    color: sortKey === col ? "#C4993A" : "var(--text-muted)",
    fontSize: "0.6rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    paddingBottom: "0.625rem",
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
    transition: "color 0.15s",
  });

  const thBase: React.CSSProperties = {
    fontSize: "0.6rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    paddingBottom: "0.625rem",
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
  };

  const sortArrow = (col: SortKey) => sortKey === col ? (sortAsc ? " ↑" : " ↓") : "";

  if (!sorted.length) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)", fontSize: "0.8rem", letterSpacing: "0.04em" }}>
        {showClosed ? "No closed positions." : "No open positions — place the first trade above."}
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle("ticker"), textAlign: "left", paddingRight: "1rem" }} onClick={() => toggleSort("ticker")}>
              Ticker{sortArrow("ticker")}
            </th>
            <th style={{ ...thBase, textAlign: "left", paddingRight: "1rem" }}>Dir</th>
            <th style={{ ...thBase, textAlign: "right", paddingRight: "1rem" }}>Shares</th>
            <th style={{ ...thBase, textAlign: "right", paddingRight: "1rem" }}>Entry</th>
            <th style={{ ...thBase, textAlign: "right", paddingRight: "1rem" }}>Current</th>
            <th style={{ ...thStyle("value"), textAlign: "right", paddingRight: "1rem" }} onClick={() => toggleSort("value")}>
              Mkt Value{sortArrow("value")}
            </th>
            <th style={{ ...thStyle("weight"), textAlign: "right", paddingRight: "1rem" }} onClick={() => toggleSort("weight")}>
              Weight{sortArrow("weight")}
            </th>
            <th style={{ ...thStyle("pnl"), textAlign: "right", paddingRight: "1rem" }} onClick={() => toggleSort("pnl")}>
              Unrlzd P&L{sortArrow("pnl")}
            </th>
            <th style={{ ...thStyle("pnlPct"), textAlign: "right", paddingRight: "1rem" }} onClick={() => toggleSort("pnlPct")}>
              Return{sortArrow("pnlPct")}
            </th>
            <th style={{ ...thStyle("sector"), textAlign: "left", paddingRight: "1rem" }} onClick={() => toggleSort("sector")}>
              Sector{sortArrow("sector")}
            </th>
            <th style={{ ...thBase, textAlign: "left" }}>Analyst</th>
            {!showClosed && <th style={{ ...thBase, textAlign: "left" }}></th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, idx) => {
            const pnl    = calcPositionPnL(p);
            const pnlPct = calcPositionPnLPct(p);
            const value  = calcPositionMarketValue(p);
            const weight = calcPositionWeight(p, nav);
            const green  = pnl >= 0;

            return (
              <tr key={p.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: idx % 2 === 0 ? "transparent" : "rgba(7,17,31,0.4)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(30,60,114,0.15)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? "transparent" : "rgba(7,17,31,0.4)"}
              >
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", fontFamily: "monospace", fontWeight: 600, color: "#EDF2F7", letterSpacing: "0.04em" }}>
                  {p.ticker}
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0" }}>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em",
                    padding: "2px 6px", borderRadius: 1,
                    background: p.direction === "L" ? "rgba(39,174,96,0.12)" : "rgba(224,49,49,0.12)",
                    color: p.direction === "L" ? "#27AE60" : "#E03131",
                    border: `1px solid ${p.direction === "L" ? "rgba(39,174,96,0.2)" : "rgba(224,49,49,0.2)"}`,
                  }}>
                    {p.direction === "L" ? "LONG" : "SHORT"}
                  </span>
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", textAlign: "right", fontFamily: "monospace", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                  {fmtShares(p.shares)}
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", textAlign: "right", fontFamily: "monospace", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  {fmt$(p.entryPrice, 2)}
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", textAlign: "right", fontFamily: "monospace", color: "var(--text-primary)", fontSize: "0.75rem" }}>
                  {p.currentPrice > 0 ? fmt$(p.currentPrice, 2) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", textAlign: "right", fontFamily: "monospace", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                  {fmt$(value, 0)}
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", textAlign: "right" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--text-secondary)" }}>{weight.toFixed(2)}%</span>
                    <div style={{ width: 48, height: 2, background: "var(--navy-700)", borderRadius: 1 }}>
                      <div style={{ height: "100%", borderRadius: 1, background: "var(--gold)", width: `${Math.min(weight * 5, 100)}%` }} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", textAlign: "right", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 600,
                  color: green ? "#27AE60" : "#E03131" }}>
                  {pnl !== 0 ? fmt$(pnl, 0) : "—"}
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", textAlign: "right", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 600,
                  color: green ? "#27AE60" : "#E03131" }}>
                  {pnlPct !== 0 ? fmtPct(pnlPct) : "—"}
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.02em" }}>
                  {p.sector || "—"}
                </td>
                <td style={{ padding: "0.5rem 1rem 0.5rem 0", color: "var(--text-muted)", fontSize: "0.7rem" }}>
                  {p.analyst || "—"}
                </td>
                {!showClosed && (
                  <td style={{ padding: "0.5rem 0" }}>
                    <button
                      onClick={() => closePos(p.id, p.ticker)}
                      style={{
                        fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "var(--text-muted)", background: "transparent", border: "none",
                        cursor: "pointer", padding: "2px 6px", transition: "color 0.15s",
                      }}
                      onMouseEnter={e => (e.target as HTMLElement).style.color = "#E03131"}
                      onMouseLeave={e => (e.target as HTMLElement).style.color = "var(--text-muted)"}
                    >
                      Close
                    </button>
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
