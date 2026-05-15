"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SectorAllocation } from "@/types";
import { fmt$ } from "@/lib/calculations";

const COLORS = [
  "#60a5fa","#34d399","#f59e0b","#f87171","#a78bfa",
  "#fb923c","#38bdf8","#4ade80","#e879f9","#facc15",
];

export default function SectorChart({ data }: { data: SectorAllocation[] }) {
  if (!data.length) return <div className="text-zinc-500 text-sm text-center py-8">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="sector" cx="50%" cy="50%" outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          formatter={(v) => [fmt$(Number(v), 0), ""]}
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff", fontSize: 12 }}
        />
        <Legend formatter={(v) => <span style={{ color: "#a1a1aa", fontSize: 11 }}>{v}</span>} iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
