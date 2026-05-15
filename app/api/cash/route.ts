import { NextResponse } from "next/server";
import { getCashBalance, ensureSheetsExist } from "@/lib/sheets";

export async function GET() {
  try {
    await ensureSheetsExist();
    const cash = await getCashBalance();
    return NextResponse.json({ cash });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch cash balance" }, { status: 500 });
  }
}
