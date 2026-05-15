"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { Position } from "@/types";
import { calcPositionPnL, fmt$ } from "@/lib/calculations";

interface Props {
  positions: Position[];
}

export default function PnLContributionChart({ positions }: Props) {
  const open = positions.filter((p) => p.status === "open" && p.currentPrice > 0);
  const data = open
    .map((p) => ({ name: p.ticker, pnl: calcPositionPnL(p) }))
    .sort((a, b) => b.pnl - a.pnl);

  if (!data.length) return <div className="text-zinc-500 text-sm text-center py-8">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
          tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }} width={44} />
        <ReferenceLine x={0} stroke="#3f3f46" />
        <Tooltip
          formatter={(v) => [fmt$(Number(v), 0), "P&L"]}
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff", fontSize: 12 }}
          cursor={{ fill: "#27272a" }}
        />
        <Bar dataKey="pnl" radius={[0, 3, 3, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? "#34d399" : "#f87171"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
