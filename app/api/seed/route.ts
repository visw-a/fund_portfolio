import { NextRequest, NextResponse } from "next/server";
import { getPositions, ensureSheetsExist, seedPositions } from "@/lib/sheets";

// Baseline portfolio as of January 1, 2026
const BASELINE_POSITIONS = [
  { ticker: "GOOG",  direction: "L" as const, shares: 73.30,    entryPrice: 313.80,   sector: "Communication Services",  analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "GOOGL", direction: "L" as const, shares: 204.43,   entryPrice: 313.00,   sector: "Communication Services",  analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "AR",    direction: "L" as const, shares: 728.00,   entryPrice: 34.46,    sector: "Energy",                  analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "AAPL",  direction: "L" as const, shares: 359.42,   entryPrice: 271.86,   sector: "Information Technology",  analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "AXON",  direction: "L" as const, shares: 122.00,   entryPrice: 567.93,   sector: "Industrials",             analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "OBDC",  direction: "L" as const, shares: 1973.45,  entryPrice: 12.43,    sector: "Financials",              analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "CAT",   direction: "L" as const, shares: 57.50,    entryPrice: 572.87,   sector: "Industrials",             analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "CORZ",  direction: "L" as const, shares: 1330.00,  entryPrice: 14.56,    sector: "Information Technology",  analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "DAL",   direction: "L" as const, shares: 547.09,   entryPrice: 69.40,    sector: "Industrials",             analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "MELI",  direction: "L" as const, shares: 16.00,    entryPrice: 2014.26,  sector: "Consumer Discretionary",  analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "OTIS",  direction: "L" as const, shares: 220.69,   entryPrice: 87.35,    sector: "Industrials",             analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "PLNT",  direction: "L" as const, shares: 239.00,   entryPrice: 108.47,   sector: "Consumer Discretionary",  analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "CRM",   direction: "L" as const, shares: 144.05,   entryPrice: 264.91,   sector: "Information Technology",  analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "TDY",   direction: "L" as const, shares: 81.00,    entryPrice: 510.73,   sector: "Industrials",             analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
  { ticker: "ENSG",  direction: "L" as const, shares: 305.07,   entryPrice: 174.20,   sector: "Health Care",             analyst: "", thesis: "", notes: "", entryDate: "2026-01-01" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSheetsExist();
    const existing = await getPositions();

    if (existing.length > 0) {
      return NextResponse.json({
        message: "Sheet already has data — skipping seed.",
        count: existing.length,
      });
    }

    await seedPositions(BASELINE_POSITIONS);

    return NextResponse.json({
      message: `Seeded ${BASELINE_POSITIONS.length} baseline positions.`,
      openingNav: 754224.62,
      openingCash: 150245.12,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
