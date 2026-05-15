import { NextRequest, NextResponse } from "next/server";
import {
  getPositions, appendPosition, appendTransaction,
  ensureSheetsExist,
} from "@/lib/sheets";
import { z } from "zod";

const TradeSchema = z.object({
  ticker: z.string().min(1).max(10),
  action: z.enum(["BUY", "SELL", "SHORT", "COVER"]),
  shares: z.number().positive(),
  price: z.number().positive(),
  date: z.string(),
  sector: z.string().default(""),
  analyst: z.string().default(""),
  thesis: z.string().default(""),
  notes: z.string().default(""),
});

export async function GET() {
  try {
    await ensureSheetsExist();
    const positions = await getPositions();
    return NextResponse.json(positions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = TradeSchema.parse(body);

    await ensureSheetsExist();
    const positions = await getPositions();

    const ticker = data.ticker.toUpperCase();
    const isLong = data.action === "BUY" || data.action === "SELL";
    const direction = isLong ? "L" : "S";
    const isOpen = data.action === "BUY" || data.action === "SHORT";
    const cashFlow = isLong
      ? (data.action === "BUY" ? -(data.shares * data.price) : data.shares * data.price)
      : (data.action === "SHORT" ? data.shares * data.price : -(data.shares * data.price));

    // Find existing open position for this ticker + direction
    const existing = positions.find(
      (p) => p.ticker === ticker && p.direction === direction && p.status === "open"
    );

    if (isOpen) {
      if (existing) {
        // Add to existing position (weighted avg entry not updated — uses original entry price)
        const newShares = existing.shares + data.shares;
        const { updatePositionShares } = await import("@/lib/sheets");
        await updatePositionShares(existing.id, newShares, data.notes);
        await appendTransaction({
          date: data.date,
          ticker,
          direction,
          action: "add",
          shares: data.shares,
          price: data.price,
          cashFlow,
          notes: data.notes,
        });
      } else {
        // Open new position
        await appendPosition({
          ticker,
          direction,
          shares: data.shares,
          entryPrice: data.price,
          entryDate: data.date,
          sector: data.sector,
          analyst: data.analyst,
          thesis: data.thesis,
          notes: data.notes,
        });
        await appendTransaction({
          date: data.date,
          ticker,
          direction,
          action: "open",
          shares: data.shares,
          price: data.price,
          cashFlow,
          notes: data.notes,
        });
      }
    } else {
      // SELL or COVER — reduce existing position
      if (!existing) {
        return NextResponse.json(
          { error: `No open ${direction === "L" ? "long" : "short"} position found for ${ticker}` },
          { status: 400 }
        );
      }

      if (data.shares > existing.shares) {
        return NextResponse.json(
          { error: `Cannot ${data.action} more shares than held (holding ${existing.shares})` },
          { status: 400 }
        );
      }

      const newShares = existing.shares - data.shares;
      const { updatePositionShares, closePosition } = await import("@/lib/sheets");

      if (newShares === 0) {
        await closePosition(existing.id);
        await appendTransaction({
          date: data.date,
          ticker,
          direction,
          action: "close",
          shares: data.shares,
          price: data.price,
          cashFlow,
          notes: data.notes,
        });
      } else {
        await updatePositionShares(existing.id, newShares, data.notes);
        await appendTransaction({
          date: data.date,
          ticker,
          direction,
          action: "trim",
          shares: data.shares,
          price: data.price,
          cashFlow,
          notes: data.notes,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to execute trade" }, { status: 500 });
  }
}
