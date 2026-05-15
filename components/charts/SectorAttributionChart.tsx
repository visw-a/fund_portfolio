"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Position } from "@/types";
import { calcPositionPnL, fmt$ } from "@/lib/calculations";

const TT_STYLE = { background: "#07111F", border: "1px solid #112545", borderRadius: 2, color: "#EDF2F7", fontSize: 12, padding: "8px 12px" };

const SHORT: Record<string, string> = {
  "Information Technology": "Info Tech",
  "Communication Services": "Comm Svcs",
  "Consumer Discretionary": "Cons Disc",
  "Consumer Staples": "Cons Stap",
  "Health Care": "Healthcare",
  "Industrials": "Industrials",
  "Financials": "Financials",
  "Energy": "Energy",
  "Materials": "Materials",
  "Utilities": "Utilities",
  "Real Estate": "Real Estate",
};

export default function SectorAttributionChart({ positions }: { positions: Position[] }) {
  const map: Record<string, number> = {};
  for (const p of positions.filter((p) => p.status === "open" && p.currentPrice > 0)) {
    const k = p.sector || "Other";
    map[k] = (map[k] ?? 0) + calcPositionPnL(p);
  }
  const data = Object.entries(map).map(([name, pnl]) => ({ name: SHORT[name] ?? name, pnl })).sort((a, b) => b.pnl - a.pnl);

  if (!data.length) return <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: "2rem 0" }}>No data</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={26} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#3D6680", fontSize: 9, letterSpacing: 0.5 }} />
        <YAxis hide />
        <ReferenceLine y={0} stroke="#112545" />
        <Tooltip formatter={(v) => [fmt$(Number(v), 0), "Sector P&L"]} contentStyle={TT_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
        <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
          {data.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? "#27AE60" : "#E03131"} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
