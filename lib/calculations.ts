import { Position, PortfolioStats, PriceMap, SectorAllocation } from "@/types";
import { OPENING_NAV } from "./constants";

export function enrichWithPrices(positions: Position[], prices: PriceMap): Position[] {
  return positions.map((p) => ({
    ...p,
    currentPrice: prices[p.ticker] ?? p.currentPrice,
  }));
}

export function calcPositionPnL(p: Position): number {
  const diff = p.currentPrice - p.entryPrice;
  return p.direction === "L" ? diff * p.shares : -diff * p.shares;
}

export function calcPositionPnLPct(p: Position): number {
  if (p.entryPrice === 0) return 0;
  const raw = (p.currentPrice - p.entryPrice) / p.entryPrice;
  return (p.direction === "L" ? raw : -raw) * 100;
}

export function calcPositionMarketValue(p: Position): number {
  return p.currentPrice * p.shares;
}

export function calcPositionWeight(p: Position, nav: number): number {
  if (nav === 0) return 0;
  return (calcPositionMarketValue(p) / nav) * 100;
}

export function calcPortfolioStats(
  positions: Position[],
  cashBalance: number
): PortfolioStats {
  const open = positions.filter((p) => p.status === "open");
  const longs = open.filter((p) => p.direction === "L");
  const shorts = open.filter((p) => p.direction === "S");

  const totalLongValue = longs.reduce((s, p) => s + calcPositionMarketValue(p), 0);
  const totalShortValue = shorts.reduce((s, p) => s + calcPositionMarketValue(p), 0);

  // NAV = cash + long market values - short market values (shorts are liabilities)
  const nav = cashBalance + totalLongValue - totalShortValue;
  const grossExposure = totalLongValue + totalShortValue;
  const netExposure = totalLongValue - totalShortValue;
  const netExposurePct = nav > 0 ? (netExposure / nav) * 100 : 0;
  const longShortRatio = totalShortValue > 0 ? totalLongValue / totalShortValue : 0;
  const cashPct = nav > 0 ? (cashBalance / nav) * 100 : 0;

  const totalUnrealizedPnL = open.reduce((s, p) => s + calcPositionPnL(p), 0);
  const totalCost = open.reduce((s, p) => s + p.entryPrice * p.shares, 0);
  const totalUnrealizedPnLPct = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0;

  const inceptionReturn = nav - OPENING_NAV;
  const inceptionReturnPct = (inceptionReturn / OPENING_NAV) * 100;

  return {
    nav,
    openingNav: OPENING_NAV,
    inceptionReturn,
    inceptionReturnPct,
    cashBalance,
    cashPct,
    totalLongValue,
    totalShortValue,
    grossExposure,
    netExposure,
    netExposurePct,
    longShortRatio,
    totalUnrealizedPnL,
    totalUnrealizedPnLPct,
    openPositions: open.length,
    longCount: longs.length,
    shortCount: shorts.length,
  };
}

export function calcSectorAllocations(
  positions: Position[],
  nav: number
): SectorAllocation[] {
  const map: Record<string, number> = {};
  for (const p of positions.filter((p) => p.status === "open")) {
    const key = p.sector || "Other";
    map[key] = (map[key] ?? 0) + calcPositionMarketValue(p);
  }
  return Object.entries(map)
    .map(([sector, value]) => ({ sector, value, weight: (value / nav) * 100 }))
    .sort((a, b) => b.value - a.value);
}

// ── Formatting ─────────────────────────────────────────────────────────────

export function fmt$(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtPct(n: number, decimals = 2): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}

export function fmtNum(n: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtShares(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(n);
}
