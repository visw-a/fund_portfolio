# Setup Guide

## 1. Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it something like **"MII L/S Fund"**
3. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_YOUR_SHEET_ID`**`/edit`

## 2. Create a Google Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the **Google Sheets API**:
   - Go to **APIs & Services → Library**
   - Search "Google Sheets API" → Enable
4. Create a Service Account:
   - Go to **APIs & Services → Credentials → Create Credentials → Service Account**
   - Name it (e.g. `fund-dashboard`) → Create
5. Download the JSON key:
   - Click your service account → **Keys** tab → **Add Key → Create new key → JSON**
   - This downloads a `.json` file — keep it safe

## 3. Share the Google Sheet with the Service Account

1. Open the downloaded JSON file and copy the `client_email` field (looks like `fund-dashboard@your-project.iam.gserviceaccount.com`)
2. Open your Google Sheet → **Share** → paste that email → give it **Editor** access

## 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
GOOGLE_SHEET_ID=your_sheet_id_from_step_1
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...",...}
```

For `GOOGLE_SERVICE_ACCOUNT_JSON`, paste the **entire contents** of the downloaded JSON file as a single line (minified).

## 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app will auto-create the **positions** and **transactions** sheets on first load.

## 6. Deploy to Vercel (Free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Add the environment variables in Vercel's dashboard:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
4. Deploy — Vercel gives you a free `.vercel.app` URL

## Handoff for Future Executives

- **Positions** are stored in the `positions` tab of the Google Sheet
- **All trades** are logged in the `transactions` tab
- To update the website, future execs only need to:
  1. Have access to the Google Sheet (share it with them)
  2. The Vercel deployment is automatic — any code changes pushed to GitHub redeploy instantly
  3. To add a new admin, just share the Google Sheet with them

## Google Sheet Column Reference

### `positions` sheet
| Column | Field | Notes |
|--------|-------|-------|
| A | id | Auto-generated, do not edit |
| B | ticker | Stock symbol (AAPL, TSLA, etc.) |
| C | direction | L (Long) or S (Short) |
| D | shares | Number of shares held |
| E | entry_price | Price at which position was opened |
| F | current_price | Auto-updated by the app |
| G | entry_date | YYYY-MM-DD format |
| H | sector | Industry sector |
| I | analyst | Name of the analyst who recommended it |
| J | thesis | Investment thesis |
| K | status | "open" or "closed" |
| L | notes | Any additional notes |
