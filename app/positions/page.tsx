"use client";

import { useEffect, useState, useCallback } from "react";
import { Position, PriceMap } from "@/types";
import { enrichWithPrices, calcPortfolioStats } from "@/lib/calculations";
import PositionsTable from "@/components/PositionsTable";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"open" | "closed">("open");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [posRes, priceRes, cashRes] = await Promise.all([
        fetch("/api/positions"),
        fetch("/api/prices"),
        fetch("/api/cash"),
      ]);
      const raw: Position[] = await posRes.json();
      const prices: PriceMap = await priceRes.json();
      const { cash } = await cashRes.json();
      setPositions(enrichWithPrices(raw, prices));
      setCashBalance(cash);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = calcPortfolioStats(positions, cashBalance);
  const openCount = positions.filter((p) => p.status === "open").length;
  const closedCount = positions.filter((p) => p.status === "closed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Positions</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Full position detail · sortable by any column</p>
        </div>
        <a href="/trade" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Place Trade
        </a>
      </div>

      <div className="flex gap-1 border-b border-zinc-800">
        {([["open", openCount], ["closed", closedCount]] as const).map(([t, count]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-white"
            }`}>
            {t} <span className="text-zinc-600 text-xs ml-1">({count})</span>
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm animate-pulse">Loading positions...</div>
        ) : (
          <PositionsTable
            positions={positions}
            nav={stats.nav}
            showClosed={tab === "closed"}
            onUpdated={refresh}
          />
        )}
      </div>
    </div>
  );
}
