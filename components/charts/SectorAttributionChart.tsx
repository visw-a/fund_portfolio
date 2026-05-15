"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { Position } from "@/types";
import { calcPositionPnL, fmt$ } from "@/lib/calculations";

interface Props {
  positions: Position[];
}

export default function SectorAttributionChart({ positions }: Props) {
  const open = positions.filter((p) => p.status === "open" && p.currentPrice > 0);

  const sectorPnL: Record<string, number> = {};
  for (const p of open) {
    const key = p.sector || "Other";
    sectorPnL[key] = (sectorPnL[key] ?? 0) + calcPositionPnL(p);
  }

  const data = Object.entries(sectorPnL)
    .map(([name, pnl]) => ({ name, pnl }))
    .sort((a, b) => b.pnl - a.pnl);

  if (!data.length) return <div className="text-zinc-500 text-sm text-center py-8">No data</div>;

  // Shorten sector names
  const shorten = (s: string) =>
    s.replace("Information Technology", "Info Tech")
     .replace("Communication Services", "Comm Svcs")
     .replace("Consumer Discretionary", "Cons Disc")
     .replace("Consumer Staples", "Cons Stap")
     .replace("Health Care", "Healthcare");

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data.map((d) => ({ ...d, name: shorten(d.name) }))} barSize={28}>
        <XAxis dataKey="name" axisLine={false} tickLine={false}
          tick={{ fill: "#71717a", fontSize: 10 }} />
        <YAxis hide />
        <ReferenceLine y={0} stroke="#3f3f46" />
        <Tooltip
          formatter={(v) => [fmt$(Number(v), 0), "Sector P&L"]}
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff", fontSize: 12 }}
          cursor={{ fill: "#27272a" }}
        />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? "#34d399" : "#f87171"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
