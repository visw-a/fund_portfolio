"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SectorAllocation } from "@/types";
import { fmt$ } from "@/lib/calculations";

const PALETTE = ["#2E66A8","#C4993A","#27AE60","#5B90C8","#1A6B47","#8B6914","#204880","#DDB95A","#95B9D9","#4A7FC1"];
const TT_STYLE = { background: "#07111F", border: "1px solid #112545", borderRadius: 2, color: "#EDF2F7", fontSize: 12, padding: "8px 12px" };

export default function SectorChart({ data }: { data: SectorAllocation[] }) {
  if (!data.length) return <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: "2rem 0" }}>No data</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="sector" cx="50%" cy="50%"
          outerRadius={78} innerRadius={32} paddingAngle={2} strokeWidth={0}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip
          formatter={(v) => [fmt$(Number(v), 0), ""]}
          contentStyle={TT_STYLE}
        />
        <Legend
          formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 10, letterSpacing: "0.04em" }}>{v}</span>}
          iconSize={7} iconType="square"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
