import { NextRequest, NextResponse } from "next/server";
import { getPositions, updatePositionShares, closePosition, appendTransaction } from "@/lib/sheets";
import { z } from "zod";

const TrimSchema = z.object({
  action: z.enum(["trim", "add"]),
  shares: z.number().positive(),
  price: z.number().positive(),
  notes: z.string().default(""),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const data = TrimSchema.parse(body);
    const { id } = await params;

    const positions = await getPositions();
    const position = positions.find((p) => p.id === id);
    if (!position) return NextResponse.json({ error: "Position not found" }, { status: 404 });

    const newShares =
      data.action === "trim"
        ? position.shares - data.shares
        : position.shares + data.shares;

    if (newShares < 0) {
      return NextResponse.json({ error: "Cannot trim more shares than held" }, { status: 400 });
    }

    // Cash flow: trim (sell) = +, add (buy) = -; shorts are inverted
    const isLong = position.direction === "L";
    const cashFlow = data.action === "trim"
      ? (isLong ? 1 : -1) * data.shares * data.price
      : (isLong ? -1 : 1) * data.shares * data.price;

    if (newShares === 0) {
      await closePosition(id);
      await appendTransaction({
        date: new Date().toISOString().split("T")[0],
        ticker: position.ticker,
        direction: position.direction,
        action: "close",
        shares: data.shares,
        price: data.price,
        cashFlow,
        notes: data.notes,
      });
    } else {
      await updatePositionShares(id, newShares, data.notes);
      await appendTransaction({
        date: new Date().toISOString().split("T")[0],
        ticker: position.ticker,
        direction: position.direction,
        action: data.action,
        shares: data.shares,
        price: data.price,
        cashFlow,
        notes: data.notes,
      });
    }

    return NextResponse.json({ success: true, newShares });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const positions = await getPositions();
    const position = positions.find((p) => p.id === id);
    if (!position) return NextResponse.json({ error: "Position not found" }, { status: 404 });

    const exitPrice = position.currentPrice || position.entryPrice;
    const isLong = position.direction === "L";
    const cashFlow = isLong ? position.shares * exitPrice : -(position.shares * exitPrice);

    await closePosition(id);
    await appendTransaction({
      date: new Date().toISOString().split("T")[0],
      ticker: position.ticker,
      direction: position.direction,
      action: "close",
      shares: position.shares,
      price: exitPrice,
      cashFlow,
      notes: "Position closed",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to close position" }, { status: 500 });
  }
}
