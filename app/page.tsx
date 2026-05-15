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

// ── Reusable metric tile ──────────────────────────────────────────────────────
function KPI({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: "var(--navy-900)", border: "1px solid var(--border)",
      borderRadius: 2, padding: "0.875rem 1rem",
    }}>
      <div className="section-label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 700, color: accent ?? "var(--text-primary)", letterSpacing: "0.02em", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.04em" }}>{sub}</div>}
    </div>
  );
}

// ── Small secondary stat ──────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: "0.625rem 0.875rem", borderRight: "1px solid var(--border)", flex: 1, minWidth: 0 }}>
      <div className="section-label" style={{ marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 600, color: color ?? "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "var(--navy-900)", border: "1px solid var(--border)", borderRadius: 2 }}>
      <div style={{
        padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <span className="section-label">{title}</span>
          {sub && <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginLeft: 8 }}>{sub}</span>}
        </div>
        {action}
      </div>
      <div style={{ padding: "1rem" }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [positions, setPositions]   = useState<Position[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [metrics, setMetrics]       = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [tab, setTab]               = useState<"overview" | "risk" | "attribution">("overview");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pr, px, cr] = await Promise.all([
        fetch("/api/positions"), fetch("/api/prices"), fetch("/api/cash"),
      ]);
      const raw: Position[] = await pr.json();
      const prices: PriceMap = await px.json();
      const { cash } = await cr.json();
      setPositions(enrichWithPrices(raw, prices));
      setCashBalance(cash);
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour12: false }));
    } finally { setLoading(false); }
  }, []);

  const refreshMetrics = useCallback(async () => {
    try { const r = await fetch("/api/metrics"); if (r.ok) setMetrics(await r.json()); } catch { /**/ }
  }, []);

  useEffect(() => {
    refresh(); refreshMetrics();
    const t1 = setInterval(() => refresh(true), 60_000);
    const t2 = setInterval(refreshMetrics, 300_000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [refresh, refreshMetrics]);

  const open    = positions.filter((p) => p.status === "open");
  const stats   = calcPortfolioStats(positions, cashBalance);
  const sectors = calcSectorAllocations(positions, stats.nav);
  const nav     = stats.nav;

  const byValue   = [...open].sort((a, b) => b.currentPrice * b.shares - a.currentPrice * a.shares);
  const byReturn  = [...open].filter((p) => p.currentPrice > 0 && p.entryPrice > 0).sort((a, b) => {
    const ra = (a.currentPrice - a.entryPrice) / a.entryPrice * (a.direction === "L" ? 1 : -1);
    const rb = (b.currentPrice - b.entryPrice) / b.entryPrice * (b.direction === "L" ? 1 : -1);
    return rb - ra;
  });

  const spyReturn   = metrics ? ((metrics.spyPrice - metrics.spyInceptionPrice) / metrics.spyInceptionPrice) * 100 : null;
  const alpha       = spyReturn !== null ? stats.inceptionReturnPct - spyReturn : null;
  const top5Weight  = byValue.slice(0, 5).reduce((s, p) => s + (p.currentPrice * p.shares / nav) * 100, 0);
  const winRate     = open.length > 0 ? (open.filter((p) => calcPositionPnL(p) > 0).length / open.length) * 100 : 0;
  const daysOpen    = Math.floor((Date.now() - new Date("2026-01-01").getTime()) / 86400000);

  const navUp = stats.inceptionReturn >= 0;
  const pnlUp = stats.totalUnrealizedPnL >= 0;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, flexDirection: "column", gap: 12 }}>
        <div style={{ width: 28, height: 28, border: "2px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading Portfolio</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Fund Header ── */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontSize: "2rem", fontWeight: 700, color: "var(--gold)", letterSpacing: "0.02em", lineHeight: 1 }}>
              {fmt$(nav, 2)}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 600,
              color: navUp ? "#27AE60" : "#E03131" }}>
              {fmtPct(stats.inceptionReturnPct)}&nbsp;
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" }}>since inception</span>
            </span>
            {alpha !== null && (
              <span style={{ fontFamily: "monospace", fontSize: "0.875rem", color: alpha >= 0 ? "#C4993A" : "#E03131" }}>
                {alpha >= 0 ? "+" : ""}{alpha.toFixed(2)}%&nbsp;
                <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--text-muted)" }}>vs SPY</span>
              </span>
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Portfolio NAV &nbsp;·&nbsp; Base {fmt$(stats.openingNav, 0)} · 01 Jan 2026 · Day {daysOpen}
            {lastUpdated && <>&nbsp;·&nbsp; Live as of {lastUpdated}</>}
          </div>
        </div>
        <a href="/trade" style={{
          background: "var(--navy-600)", border: "1px solid var(--navy-500)", borderRadius: 2,
          color: "#fff", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "0.5rem 1.25rem", textDecoration: "none",
          transition: "background 0.15s", flexShrink: 0,
        }}>
          + Execute Trade
        </a>
      </div>

      {/* ── Primary KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        <KPI label="Unrealized P&L" value={fmt$(stats.totalUnrealizedPnL, 0)}
          sub={fmtPct(stats.totalUnrealizedPnLPct)} accent={pnlUp ? "#27AE60" : "#E03131"} />
        <KPI label="Net Exposure" value={fmtNum(stats.netExposurePct, 1) + "%"}
          sub={`${fmt$(stats.netExposure, 0)} · ${stats.netExposure >= 0 ? "Net Long" : "Net Short"}`}
          accent={stats.netExposure >= 0 ? "#27AE60" : "#E03131"} />
        <KPI label="Portfolio Beta" value={metrics ? metrics.portfolioBeta.toFixed(2) : "—"}
          sub="Market-cap wtd · vs SPY" />
        <KPI label="Cash" value={fmt$(stats.cashBalance, 0)}
          sub={`${fmtNum(stats.cashPct, 1)}% of NAV`} accent="#C4993A" />
      </div>

      {/* ── Secondary stat bar ── */}
      <div style={{
        background: "var(--navy-900)", border: "1px solid var(--border)", borderRadius: 2,
        display: "flex", overflow: "hidden",
      }}>
        <Stat label="Gross Exposure"  value={fmt$(stats.grossExposure, 0)} />
        <Stat label="Long"            value={fmt$(stats.totalLongValue, 0)}  color="#27AE60" />
        <Stat label="Short"           value={fmt$(stats.totalShortValue, 0)} color="#E03131" />
        <Stat label="L/S Ratio"       value={stats.longShortRatio > 0 ? `${stats.longShortRatio.toFixed(2)}×` : "L-Only"} />
        <Stat label="# Positions"     value={`${stats.longCount}L · ${stats.shortCount}S`} />
        <Stat label="Top-5 Conc."     value={`${top5Weight.toFixed(1)}%`} />
        <Stat label="Win Rate"        value={`${winRate.toFixed(0)}%`} color={winRate >= 50 ? "#27AE60" : "#E03131"} />
        <div style={{ padding: "0.625rem 0.875rem", flex: 1, minWidth: 0 }}>
          <div className="section-label" style={{ marginBottom: 3 }}>SPY Return</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 600,
            color: spyReturn !== null ? (spyReturn >= 0 ? "#27AE60" : "#E03131") : "var(--text-muted)" }}>
            {spyReturn !== null ? fmtPct(spyReturn) : "—"}
          </div>
        </div>
      </div>

      {/* ── Analysis tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)" }}>
        {(["overview", "risk", "attribution"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "0.5rem 1.25rem",
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: tab === t ? "var(--gold)" : "var(--text-muted)",
            borderBottom: `2px solid ${tab === t ? "var(--gold)" : "transparent"}`,
            marginBottom: -1,
            transition: "color 0.15s",
          }}>
            {t === "overview" ? "Overview" : t === "risk" ? "Risk & Beta" : "Attribution"}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Panel title="Exposure Breakdown">
              <ExposureChart longValue={stats.totalLongValue} shortValue={stats.totalShortValue}
                netExposure={stats.netExposure} cashBalance={stats.cashBalance} />
            </Panel>
            <Panel title="Sector Allocation">
              <SectorChart data={sectors} />
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            {/* Top performers */}
            <Panel title="Top Performers">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {byReturn.slice(0, 5).map((p) => {
                  const ret = (p.currentPrice - p.entryPrice) / p.entryPrice * 100 * (p.direction === "L" ? 1 : -1);
                  return (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{p.ticker}</span>
                        <span style={{ fontSize: "0.55rem", color: p.direction === "L" ? "#27AE60" : "#E03131", fontWeight: 700 }}>{p.direction}</span>
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 600, color: "#27AE60" }}>{fmtPct(ret)}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Laggards */}
            <Panel title="Laggards">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[...byReturn].reverse().slice(0, 5).map((p) => {
                  const ret = (p.currentPrice - p.entryPrice) / p.entryPrice * 100 * (p.direction === "L" ? 1 : -1);
                  return (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{p.ticker}</span>
                        <span style={{ fontSize: "0.55rem", color: p.direction === "L" ? "#27AE60" : "#E03131", fontWeight: 700 }}>{p.direction}</span>
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 600, color: "#E03131" }}>{fmtPct(ret)}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Largest positions */}
            <Panel title="Largest Holdings">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {byValue.slice(0, 5).map((p) => {
                  const w = nav > 0 ? (p.currentPrice * p.shares / nav) * 100 : 0;
                  return (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 600 }}>{p.ticker}</span>
                        <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--text-muted)" }}>{w.toFixed(2)}%</span>
                      </div>
                      <div style={{ height: 2, background: "var(--navy-700)", borderRadius: 1 }}>
                        <div style={{ height: "100%", borderRadius: 1, background: "var(--gold)", width: `${Math.min(w * 5, 100)}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ── Risk & Beta ── */}
      {tab === "risk" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
            <KPI label="Portfolio Beta" value={metrics ? metrics.portfolioBeta.toFixed(3) : "—"} sub="Mkt-cap weighted vs SPY" />
            <KPI label="Net Exposure" value={fmtNum(stats.netExposurePct, 1) + "%"}
              sub="(Long − Short) / NAV" accent={stats.netExposurePct >= 0 ? "#27AE60" : "#E03131"} />
            <KPI label="Gross Leverage" value={nav > 0 ? fmtNum(stats.grossExposure / nav * 100, 1) + "%" : "—"}
              sub="(Long + Short) / NAV" />
            <KPI label="Cash Buffer" value={fmtNum(stats.cashPct, 1) + "%"} sub={fmt$(stats.cashBalance, 0)} accent="#C4993A" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Panel title="Individual Betas" sub="Source: Yahoo Finance">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                <thead>
                  <tr>
                    {["Ticker","Beta","Weight %","Beta Contrib."].map((h, i) => (
                      <th key={h} style={{ ...({ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)", textAlign: i > 1 ? "right" : "left", paddingRight: i < 3 ? "1rem" : 0 }) }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byValue.filter((p) => p.currentPrice > 0).map((p, idx) => {
                    const b = metrics?.betas[p.ticker] ?? null;
                    const w = (p.currentPrice * p.shares / nav) * 100;
                    const contrib = b !== null ? b * (w / 100) * (p.direction === "S" ? -1 : 1) : null;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: idx % 2 === 0 ? "transparent" : "rgba(7,17,31,0.4)" }}>
                        <td style={{ padding: "0.375rem 1rem 0.375rem 0", fontFamily: "monospace", fontWeight: 600, color: "var(--text-primary)" }}>{p.ticker}</td>
                        <td style={{ padding: "0.375rem 1rem 0.375rem 0", fontFamily: "monospace", color: "var(--text-secondary)" }}>{b !== null ? b.toFixed(2) : "—"}</td>
                        <td style={{ padding: "0.375rem 1rem 0.375rem 0", textAlign: "right", fontFamily: "monospace", color: "var(--text-muted)" }}>{w.toFixed(2)}%</td>
                        <td style={{ padding: "0.375rem 0", textAlign: "right", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 600,
                          color: contrib !== null ? (contrib >= 0 ? "#27AE60" : "#E03131") : "var(--text-muted)" }}>
                          {contrib !== null ? (contrib >= 0 ? "+" : "") + contrib.toFixed(3) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>

            <Panel title="Risk / Return" sub="Bubble size = portfolio weight">
              <RiskReturnChart positions={positions} nav={nav} />
            </Panel>
          </div>
        </>
      )}

      {/* ── Attribution ── */}
      {tab === "attribution" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Panel title="P&L by Position" sub="Unrealized, sorted by magnitude">
              <PnLContributionChart positions={positions} />
            </Panel>
            <Panel title="P&L by Sector" sub="Aggregate unrealized by GICS sector">
              <SectorAttributionChart positions={positions} />
            </Panel>
          </div>

          <Panel title="Attribution Detail" sub="Full position breakdown sorted by absolute P&L">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
              <thead>
                <tr>
                  {["Security","Sector","Entry","Current","Return","Weight","P&L $"].map((h, i) => (
                    <th key={h} style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "var(--text-muted)", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)",
                      textAlign: i >= 2 ? "right" : "left", paddingRight: i < 6 ? "1rem" : 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...open].sort((a, b) => Math.abs(calcPositionPnL(b)) - Math.abs(calcPositionPnL(a))).map((p, idx) => {
                  const pnl  = calcPositionPnL(p);
                  const ret  = p.entryPrice > 0 ? (p.currentPrice - p.entryPrice) / p.entryPrice * 100 * (p.direction === "L" ? 1 : -1) : 0;
                  const w    = nav > 0 ? (p.currentPrice * p.shares / nav) * 100 : 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: idx % 2 === 0 ? "transparent" : "rgba(7,17,31,0.4)" }}>
                      <td style={{ padding: "0.375rem 1rem 0.375rem 0" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)" }}>{p.ticker}</span>
                        <span style={{ marginLeft: 6, fontSize: "0.55rem", fontWeight: 700, color: p.direction === "L" ? "#27AE60" : "#E03131" }}>{p.direction}</span>
                      </td>
                      <td style={{ padding: "0.375rem 1rem 0.375rem 0", color: "var(--text-muted)", fontSize: "0.7rem" }}>{p.sector || "—"}</td>
                      <td style={{ padding: "0.375rem 1rem 0.375rem 0", textAlign: "right", fontFamily: "monospace", color: "var(--text-muted)" }}>{fmt$(p.entryPrice, 2)}</td>
                      <td style={{ padding: "0.375rem 1rem 0.375rem 0", textAlign: "right", fontFamily: "monospace", color: "var(--text-primary)" }}>{p.currentPrice > 0 ? fmt$(p.currentPrice, 2) : "—"}</td>
                      <td style={{ padding: "0.375rem 1rem 0.375rem 0", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: ret >= 0 ? "#27AE60" : "#E03131" }}>{fmtPct(ret)}</td>
                      <td style={{ padding: "0.375rem 1rem 0.375rem 0", textAlign: "right", fontFamily: "monospace", color: "var(--text-muted)" }}>{w.toFixed(2)}%</td>
                      <td style={{ padding: "0.375rem 0", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: pnl >= 0 ? "#27AE60" : "#E03131" }}>{fmt$(pnl, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </>
      )}

      {/* ── Holdings Table ── */}
      <Panel title="Holdings"
        sub={`${open.length} open positions · Click column headers to sort`}
        action={<a href="/positions" style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", textDecoration: "none" }}>Full View →</a>}
      >
        <PositionsTable positions={positions} nav={nav} onUpdated={refresh} />
      </Panel>
    </div>
  );
}
