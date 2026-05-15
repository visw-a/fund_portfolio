"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ZAxis, Label,
} from "recharts";
import { Position } from "@/types";
import { calcPositionPnLPct, calcPositionMarketValue, fmt$ } from "@/lib/calculations";

interface Props {
  positions: Position[];
  nav: number;
}

const COLORS: Record<string, string> = {
  "Information Technology": "#60a5fa",
  "Communication Services": "#34d399",
  "Industrials": "#f59e0b",
  "Health Care": "#a78bfa",
  "Energy": "#fb923c",
  "Financials": "#38bdf8",
  "Consumer Discretionary": "#f87171",
  "Other": "#71717a",
};

export default function RiskReturnChart({ positions, nav }: Props) {
  const open = positions.filter((p) => p.status === "open" && p.currentPrice > 0 && p.entryPrice > 0);

  const data = open.map((p) => ({
    ticker: p.ticker,
    ret: parseFloat(calcPositionPnLPct(p).toFixed(2)),
    weight: parseFloat(((calcPositionMarketValue(p) / nav) * 100).toFixed(2)),
    value: calcPositionMarketValue(p),
    sector: p.sector || "Other",
    direction: p.direction,
  }));

  if (!data.length) return <div className="text-zinc-500 text-sm text-center py-8">No data</div>;

  // Group by sector for coloring
  const bySector = data.reduce<Record<string, typeof data>>((acc, d) => {
    (acc[d.sector] = acc[d.sector] ?? []).push(d);
    return acc;
  }, {});

  // Custom dot label
  const CustomDot = (props: Record<string, unknown>) => {
    const { cx, cy, payload } = props as { cx: number; cy: number; payload: typeof data[0] };
    return (
      <g>
        <circle cx={cx} cy={cy} r={Math.sqrt((payload.weight / 20) * 300)} fill={COLORS[payload.sector] ?? "#71717a"} fillOpacity={0.7} />
        <text x={cx} y={cy - Math.sqrt((payload.weight / 20) * 300) - 4} textAnchor="middle" fill="#a1a1aa" fontSize={9} fontFamily="monospace">
          {payload.ticker}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
        <XAxis type="number" dataKey="ret" name="Return" unit="%" axisLine={false} tickLine={false}
          tick={{ fill: "#71717a", fontSize: 10 }}>
          <Label value="Return %" offset={-10} position="insideBottom" fill="#52525b" fontSize={11} />
        </XAxis>
        <YAxis type="number" dataKey="weight" name="Weight" unit="%" axisLine={false} tickLine={false}
          tick={{ fill: "#71717a", fontSize: 10 }}>
          <Label value="Weight %" angle={-90} position="insideLeft" fill="#52525b" fontSize={11} />
        </YAxis>
        <ZAxis range={[40, 400]} />
        <ReferenceLine x={0} stroke="#3f3f46" strokeDasharray="4 2" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "#3f3f46" }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload as typeof data[0];
            return (
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs space-y-0.5">
                <p className="font-mono font-bold text-white">{d.ticker} <span className={d.direction === "L" ? "text-emerald-400" : "text-red-400"}>({d.direction})</span></p>
                <p className="text-zinc-400">{d.sector}</p>
                <p className="text-zinc-300">Return: <span className={d.ret >= 0 ? "text-emerald-400" : "text-red-400"}>{d.ret >= 0 ? "+" : ""}{d.ret}%</span></p>
                <p className="text-zinc-300">Weight: {d.weight}%</p>
                <p className="text-zinc-300">Value: {fmt$(d.value, 0)}</p>
              </div>
            );
          }}
        />
        {Object.entries(bySector).map(([sector, pts]) => (
          <Scatter key={sector} name={sector} data={pts}
            fill={COLORS[sector] ?? "#71717a"}
            shape={(props) => <CustomDot {...props} />}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
