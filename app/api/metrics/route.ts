import { NextResponse } from "next/server";
import { getPositions } from "@/lib/sheets";
import { fetchMetrics } from "@/lib/metrics";

export async function GET() {
  try {
    const positions = await getPositions();
    const metrics = await fetchMetrics(positions);
    return NextResponse.json(metrics);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
