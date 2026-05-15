"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Position } from "@/types";
import { calcPositionPnL, fmt$ } from "@/lib/calculations";

const TT_STYLE = { background: "#07111F", border: "1px solid #112545", borderRadius: 2, color: "#EDF2F7", fontSize: 12, padding: "8px 12px" };

export default function PnLContributionChart({ positions }: { positions: Position[] }) {
  const open = positions.filter((p) => p.status === "open" && p.currentPrice > 0);
  const data = open.map((p) => ({ name: p.ticker, pnl: calcPositionPnL(p) })).sort((a, b) => b.pnl - a.pnl);

  if (!data.length) return <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: "2rem 0" }}>No data</div>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
          tick={{ fill: "#7FA3BE", fontSize: 10, fontFamily: "monospace" }} width={42} />
        <ReferenceLine x={0} stroke="#112545" />
        <Tooltip formatter={(v) => [fmt$(Number(v), 0), "P&L"]} contentStyle={TT_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
        <Bar dataKey="pnl" radius={[0, 2, 2, 0]}>
          {data.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? "#27AE60" : "#E03131"} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
