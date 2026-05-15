import "server-only";
import yahooFinance from "yahoo-finance2";
import { PriceMap } from "@/types";

// yahoo-finance2 v3 requires instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (yahooFinance as any)({ suppressNotices: ["yahooSurvey"] });

export async function fetchPrices(tickers: string[]): Promise<PriceMap> {
  if (tickers.length === 0) return {};

  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const quote = await yf.quote(ticker);
      const price = (quote as Record<string, unknown>).regularMarketPrice as number | undefined;
      return { ticker, price: price ?? 0 };
    })
  );

  const map: PriceMap = {};
  for (const result of results) {
    if (result.status === "fulfilled") {
      map[result.value.ticker] = result.value.price;
    }
  }
  return map;
}
