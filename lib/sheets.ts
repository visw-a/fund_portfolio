import "server-only";
import { google } from "googleapis";
import { Position, Transaction, Direction, PositionStatus, TransactionAction } from "@/types";
import { OPENING_CASH } from "./constants";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuth() {
  // Support both a single JSON blob OR split individual vars (easier for Vercel)
  let credentials: Record<string, string>;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else {
    credentials = {
      type: "service_account",
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      // Vercel stores \n literally — replace with actual newlines
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

// ── Positions ──────────────────────────────────────────────────────────────

export async function getPositions(): Promise<Position[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "positions!A2:L",
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? "",
      ticker: (r[1] ?? "").toUpperCase(),
      direction: (r[2] ?? "L") as Direction,
      shares: parseFloat(r[3]) || 0,
      entryPrice: parseFloat(r[4]) || 0,
      currentPrice: parseFloat(r[5]) || 0,
      entryDate: r[6] ?? "",
      sector: r[7] ?? "",
      analyst: r[8] ?? "",
      thesis: r[9] ?? "",
      status: (r[10] ?? "open") as PositionStatus,
      notes: r[11] ?? "",
    }));
}

export async function appendPosition(
  position: Omit<Position, "id" | "currentPrice" | "status">
): Promise<string> {
  const sheets = await getSheets();
  const id = Date.now().toString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "positions!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        id,
        position.ticker.toUpperCase(),
        position.direction,
        position.shares,
        position.entryPrice,
        "",
        position.entryDate,
        position.sector,
        position.analyst,
        position.thesis,
        "open",
        position.notes,
      ]],
    },
  });
  return id;
}

export async function updatePositionShares(
  id: string,
  newShares: number,
  notes: string
): Promise<void> {
  const rowIndex = await findPositionRow(id);
  if (rowIndex === -1) throw new Error(`Position ${id} not found`);
  const sheets = await getSheets();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `positions!D${rowIndex}`, values: [[newShares]] },
        { range: `positions!L${rowIndex}`, values: [[notes]] },
      ],
    },
  });
}

export async function closePosition(id: string): Promise<void> {
  const rowIndex = await findPositionRow(id);
  if (rowIndex === -1) throw new Error(`Position ${id} not found`);
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `positions!K${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [["closed"]] },
  });
}

async function findPositionRow(id: string): Promise<number> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "positions!A:A",
  });
  const rows = res.data.values ?? [];
  const idx = rows.findIndex((r) => r[0] === id);
  return idx === -1 ? -1 : idx + 1;
}

// ── Transactions ───────────────────────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "transactions!A2:I",
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0] ?? "",
      date: r[1] ?? "",
      ticker: r[2] ?? "",
      direction: (r[3] ?? "L") as Direction,
      action: (r[4] ?? "open") as TransactionAction,
      shares: parseFloat(r[5]) || 0,
      price: parseFloat(r[6]) || 0,
      cashFlow: parseFloat(r[7]) || 0,
      notes: r[8] ?? "",
    }));
}

export async function appendTransaction(
  tx: Omit<Transaction, "id">
): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "transactions!A:I",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        Date.now().toString(),
        tx.date,
        tx.ticker.toUpperCase(),
        tx.direction,
        tx.action,
        tx.shares,
        tx.price,
        tx.cashFlow,
        tx.notes,
      ]],
    },
  });
}

// ── Cash Balance ───────────────────────────────────────────────────────────

export async function getCashBalance(): Promise<number> {
  const transactions = await getTransactions();
  const totalCashFlow = transactions.reduce((sum, t) => sum + t.cashFlow, 0);
  return OPENING_CASH + totalCashFlow;
}

// ── Sheet Initialization ───────────────────────────────────────────────────

export async function ensureSheetsExist(): Promise<void> {
  const sheets = await getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existing = (meta.data.sheets ?? []).map((s) => s.properties?.title);

  const toCreate = ["positions", "transactions", "nav_history"].filter(
    (name) => !existing.includes(name)
  );
  if (toCreate.length === 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: toCreate.map((title) => ({
        addSheet: { properties: { title } },
      })),
    },
  });

  if (toCreate.includes("positions")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "positions!A1:L1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["id", "ticker", "direction", "shares", "entry_price",
          "current_price", "entry_date", "sector", "analyst", "thesis",
          "status", "notes"]],
      },
    });
  }
  if (toCreate.includes("transactions")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "transactions!A1:I1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["id", "date", "ticker", "direction", "action",
          "shares", "price", "cash_flow", "notes"]],
      },
    });
  }
  if (toCreate.includes("nav_history")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "nav_history!A1:C1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["date", "nav", "spy_price"]] },
    });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "nav_history!A:C",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["2026-01-01", 754224.62, 591.79]] },
    });
  }
}

// ── NAV History ────────────────────────────────────────────────────────────

export interface NavSnapshot { date: string; nav: number; spyPrice: number; }

export async function getNavHistory(): Promise<NavSnapshot[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "nav_history!A2:C" });
  return (res.data.values ?? []).filter((r) => r[0]).map((r) => ({
    date: r[0], nav: parseFloat(r[1]) || 0, spyPrice: parseFloat(r[2]) || 0,
  }));
}

export async function upsertNavSnapshot(date: string, nav: number, spyPrice: number): Promise<void> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "nav_history!A:A" });
  const rows = res.data.values ?? [];
  const rowIdx = rows.findIndex((r) => r[0] === date);

  if (rowIdx > 0) {
    // Update existing row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `nav_history!B${rowIdx + 1}:C${rowIdx + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[nav, spyPrice]] },
    });
  } else {
    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "nav_history!A:C",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[date, nav, spyPrice]] },
    });
  }
}

// ── Bulk Seed ──────────────────────────────────────────────────────────────

export async function seedPositions(
  items: Array<Omit<Position, "id" | "currentPrice" | "status">>
): Promise<void> {
  const sheets = await getSheets();
  const rows = items.map((p, i) => [
    (1000 + i).toString(),
    p.ticker.toUpperCase(),
    p.direction,
    p.shares,
    p.entryPrice,
    "",
    p.entryDate,
    p.sector,
    p.analyst,
    p.thesis,
    "open",
    p.notes,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "positions!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}
