import { NextResponse } from "next/server";
import { getPositions } from "@/lib/sheets";
import { fetchPrices } from "@/lib/prices";

export async function GET() {
  try {
    const positions = await getPositions();
    const tickers = [...new Set(
      positions.filter((p) => p.status === "open").map((p) => p.ticker)
    )];
    const prices = await fetchPrices(tickers);
    return NextResponse.json(prices);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
