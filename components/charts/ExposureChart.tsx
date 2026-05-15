"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { fmt$ } from "@/lib/calculations";

interface Props {
  longValue: number;
  shortValue: number;
  netExposure: number;
  cashBalance: number;
}

const TT_STYLE = { background: "#07111F", border: "1px solid #112545", borderRadius: 2, color: "#EDF2F7", fontSize: 12, padding: "8px 12px" };

export default function ExposureChart({ longValue, shortValue, netExposure, cashBalance }: Props) {
  const data = [
    { name: "Long", value: longValue,              color: "#27AE60" },
    { name: "Short", value: shortValue,            color: "#E03131" },
    { name: "Net",  value: Math.abs(netExposure),  color: "#C4993A" },
    { name: "Cash", value: cashBalance,            color: "#2E66A8" },
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={32} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" axisLine={false} tickLine={false}
          tick={{ fill: "#3D6680", fontSize: 10, fontWeight: 600, letterSpacing: 1 }} />
        <YAxis hide />
        <ReferenceLine y={0} stroke="#112545" />
        <Tooltip
          formatter={(v) => [fmt$(Number(v), 0), ""]}
          contentStyle={TT_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
