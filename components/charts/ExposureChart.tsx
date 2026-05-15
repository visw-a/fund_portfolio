"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { fmt$ } from "@/lib/calculations";

interface Props {
  longValue: number;
  shortValue: number;
  netExposure: number;
  cashBalance: number;
}

export default function ExposureChart({ longValue, shortValue, netExposure, cashBalance }: Props) {
  const data = [
    { name: "Long", value: longValue, color: "#34d399" },
    { name: "Short", value: shortValue, color: "#f87171" },
    { name: "Net", value: Math.abs(netExposure), color: netExposure >= 0 ? "#60a5fa" : "#f97316" },
    { name: "Cash", value: cashBalance, color: "#a78bfa" },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={36} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
        <YAxis hide />
        <ReferenceLine y={0} stroke="#3f3f46" />
        <Tooltip
          formatter={(v) => [fmt$(Number(v), 0), ""]}
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff", fontSize: 12 }}
          cursor={{ fill: "#27272a" }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
