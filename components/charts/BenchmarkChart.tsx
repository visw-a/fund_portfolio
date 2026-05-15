"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";

interface DataPoint { date: string; mii: number | null; spy: number | null; }

interface Props { data: DataPoint[]; }

const TT_STYLE = {
  background: "#060F1E", border: "1px solid #0F2040", borderRadius: 2,
  color: "#F0F4F8", fontSize: 12, padding: "8px 12px",
};

function formatDate(d: string) {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPct(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export default function BenchmarkChart({ data }: Props) {
  if (!data.length) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)", fontSize: 12 }}>
        Loading benchmark data…
      </div>
    );
  }

  // Thin out data for readability (max 60 points)
  const step = Math.max(1, Math.floor(data.length / 60));
  const display = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={display} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="date" axisLine={false} tickLine={false}
          tick={{ fill: "var(--text-muted)", fontSize: 10 }}
          tickFormatter={formatDate}
          interval={Math.floor(display.length / 5)}
        />
        <YAxis axisLine={false} tickLine={false}
          tick={{ fill: "var(--text-muted)", fontSize: 10 }}
          tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
          width={48}
        />
        <ReferenceLine y={0} stroke="var(--border-lt)" strokeDasharray="4 2" />
        <Tooltip
          contentStyle={TT_STYLE}
          labelFormatter={(d) => formatDate(String(d))}
          formatter={(v, name) => [
            formatPct(v as number | null),
            (name as string) === "mii" ? "MII L/S Fund" : "S&P 500 (SPY)",
          ]}
        />
        <Legend
          formatter={(v) => (
            <span style={{ color: "var(--text-secondary)", fontSize: 10, letterSpacing: "0.04em" }}>
              {v === "mii" ? "MII L/S Fund" : "S&P 500 (SPY)"}
            </span>
          )}
          iconType="plainline"
        />
        <Line type="monotone" dataKey="mii" stroke="#4A7FC1" strokeWidth={2}
          dot={false} connectNulls activeDot={{ r: 3, fill: "#4A7FC1" }} />
        <Line type="monotone" dataKey="spy" stroke="#7FA3BE" strokeWidth={1.5}
          strokeDasharray="5 3" dot={false} connectNulls activeDot={{ r: 3, fill: "#7FA3BE" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
