import { NextResponse } from "next/server";
import { getTransactions, ensureSheetsExist } from "@/lib/sheets";

export async function GET() {
  try {
    await ensureSheetsExist();
    const transactions = await getTransactions();
    return NextResponse.json(transactions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
