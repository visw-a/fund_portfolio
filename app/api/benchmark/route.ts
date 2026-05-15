import { NextResponse } from "next/server";
import { getPositions, getNavHistory, upsertNavSnapshot, ensureSheetsExist } from "@/lib/sheets";
import { fetchPrices } from "@/lib/prices";
import { calcPortfolioStats } from "@/lib/calculations";
import yahooFinance from "yahoo-finance2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (yahooFinance as any)({ suppressNotices: ["yahooSurvey"] });

const OPENING_NAV = 754224.62;
const OPENING_DATE = "2026-01-01";

export async function GET() {
  try {
    await ensureSheetsExist();

    // Fetch SPY historical from opening date
    const spyHistory = await yf.historical("SPY", {
      period1: OPENING_DATE,
      period2: new Date().toISOString().split("T")[0],
      interval: "1d",
    }).catch(() => []);

    // Build SPY price map by date
    const spyByDate: Record<string, number> = {};
    for (const d of spyHistory) {
      const dateStr = new Date(d.date).toISOString().split("T")[0];
      spyByDate[dateStr] = d.close ?? d.adjClose ?? 0;
    }

    // Update today's NAV snapshot
    const today = new Date().toISOString().split("T")[0];
    const spyToday = spyByDate[today] ?? Object.values(spyByDate).at(-1) ?? 0;
    try {
      const positions = await getPositions();
      const open = positions.filter((p) => p.status === "open");
      const tickers = [...new Set(open.map((p) => p.ticker))];
      const prices = await fetchPrices(tickers);
      const enriched = open.map((p) => ({ ...p, currentPrice: prices[p.ticker] ?? p.currentPrice }));
      const cashRes = await import("@/lib/sheets").then((m) => m.getCashBalance());
      const stats = calcPortfolioStats(enriched as never, cashRes);
      if (stats.nav > 0) await upsertNavSnapshot(today, stats.nav, spyToday);
    } catch { /* don't fail the whole endpoint */ }

    // Get stored NAV history
    const navHistory = await getNavHistory();

    // Build aligned chart data
    const openingSpy = spyByDate[OPENING_DATE] ?? navHistory[0]?.spyPrice ?? 591.79;
    const chartData: { date: string; mii: number | null; spy: number | null }[] = [];

    // Add all SPY data points (only trading days)
    const allDates = Object.keys(spyByDate).sort();
    for (const date of allDates) {
      const spy = spyByDate[date];
      const navSnap = navHistory.find((n) => n.date === date);
      chartData.push({
        date,
        spy: openingSpy > 0 ? ((spy / openingSpy) - 1) * 100 : null,
        mii: navSnap ? ((navSnap.nav / OPENING_NAV) - 1) * 100 : null,
      });
    }

    // Always include today if we have a NAV snapshot
    const todaySnap = navHistory.find((n) => n.date === today);
    if (todaySnap && !chartData.find((d) => d.date === today)) {
      chartData.push({
        date: today,
        spy: spyToday && openingSpy > 0 ? ((spyToday / openingSpy) - 1) * 100 : null,
        mii: ((todaySnap.nav / OPENING_NAV) - 1) * 100,
      });
    }

    // Calculate Sharpe from NAV history (need 30+ days)
    let sharpe: number | null = null;
    if (navHistory.length >= 30) {
      const returns: number[] = [];
      for (let i = 1; i < navHistory.length; i++) {
        returns.push((navHistory[i].nav - navHistory[i - 1].nav) / navHistory[i - 1].nav);
      }
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const std = Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length);
      const rfDaily = 0.053 / 252; // 5.3% risk-free annualized
      sharpe = std > 0 ? ((mean - rfDaily) / std) * Math.sqrt(252) : null;
    }

    return NextResponse.json({ chartData, sharpe, dataPoints: navHistory.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch benchmark data" }, { status: 500 });
  }
}
