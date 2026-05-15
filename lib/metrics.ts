import "server-only";
import yahooFinance from "yahoo-finance2";
import { Position } from "@/types";
import { calcPositionMarketValue } from "./calculations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (yahooFinance as any)({ suppressNotices: ["yahooSurvey"] });

export interface BetaMap {
  [ticker: string]: number;
}

export interface PortfolioMetrics {
  portfolioBeta: number;
  betas: BetaMap;
  spyPrice: number;
  spyInceptionPrice: number; // SPY price on 2026-01-01 (approx)
}

// SPY closing price around Jan 1 2026 (baseline for benchmark comparison)
const SPY_INCEPTION_PRICE = 591.79;

export async function fetchMetrics(positions: Position[]): Promise<PortfolioMetrics> {
  const open = positions.filter((p) => p.status === "open");
  const tickers = [...new Set(open.map((p) => p.ticker))];

  // Fetch beta for each ticker and current SPY price in parallel
  const [betaResults, spyQuote] = await Promise.all([
    Promise.allSettled(
      tickers.map(async (ticker) => {
        try {
          const summary = await yf.quoteSummary(ticker, { modules: ["defaultKeyStatistics"] });
          const beta = summary?.defaultKeyStatistics?.beta as number | undefined;
          return { ticker, beta: beta ?? 1.0 };
        } catch {
          return { ticker, beta: 1.0 };
        }
      })
    ),
    yf.quote("SPY").catch(() => null),
  ]);

  const betas: BetaMap = {};
  for (const r of betaResults) {
    if (r.status === "fulfilled") betas[r.value.ticker] = r.value.beta;
  }

  // Weighted portfolio beta
  const totalValue = open.reduce((s, p) => s + calcPositionMarketValue(p), 0);
  let portfolioBeta = 0;
  if (totalValue > 0) {
    for (const p of open) {
      const w = calcPositionMarketValue(p) / totalValue;
      const b = betas[p.ticker] ?? 1.0;
      portfolioBeta += w * b * (p.direction === "S" ? -1 : 1);
    }
  }

  const spyPrice = (spyQuote as Record<string, unknown>)?.regularMarketPrice as number ?? 0;

  return {
    portfolioBeta: parseFloat(portfolioBeta.toFixed(3)),
    betas,
    spyPrice,
    spyInceptionPrice: SPY_INCEPTION_PRICE,
  };
}
