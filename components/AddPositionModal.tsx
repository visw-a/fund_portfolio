"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

const SECTORS = [
  "Technology", "Healthcare", "Financials", "Consumer Discretionary",
  "Consumer Staples", "Industrials", "Energy", "Materials",
  "Utilities", "Real Estate", "Communication Services", "Other",
];

interface Props {
  onAdded: () => void;
}

export default function AddPositionModal({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ticker: "", direction: "L", shares: "", entryPrice: "",
    entryDate: new Date().toISOString().split("T")[0],
    sector: "Technology", analyst: "", thesis: "", notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          shares: parseFloat(form.shares),
          entryPrice: parseFloat(form.entryPrice),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOpen(false);
      setForm({ ticker: "", direction: "L", shares: "", entryPrice: "",
        entryDate: new Date().toISOString().split("T")[0],
        sector: "Technology", analyst: "", thesis: "", notes: "" });
      onAdded();
    } catch (err) {
      alert("Failed to add position: " + err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Add Position
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-white mb-4">Open New Position</Dialog.Title>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Ticker</label>
                <input className="input uppercase" placeholder="AAPL" value={form.ticker}
                  onChange={(e) => set("ticker", e.target.value.toUpperCase())} required />
              </div>
              <div>
                <label className="label">Direction</label>
                <select className="input" value={form.direction} onChange={(e) => set("direction", e.target.value)}>
                  <option value="L">Long</option>
                  <option value="S">Short</option>
                </select>
              </div>
              <div>
                <label className="label">Shares</label>
                <input className="input" type="number" step="0.01" placeholder="100" value={form.shares}
                  onChange={(e) => set("shares", e.target.value)} required />
              </div>
              <div>
                <label className="label">Entry Price</label>
                <input className="input" type="number" step="0.01" placeholder="150.00" value={form.entryPrice}
                  onChange={(e) => set("entryPrice", e.target.value)} required />
              </div>
              <div>
                <label className="label">Entry Date</label>
                <input className="input" type="date" value={form.entryDate}
                  onChange={(e) => set("entryDate", e.target.value)} required />
              </div>
              <div>
                <label className="label">Sector</label>
                <select className="input" value={form.sector} onChange={(e) => set("sector", e.target.value)}>
                  {SECTORS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Analyst</label>
              <input className="input" placeholder="Your name" value={form.analyst}
                onChange={(e) => set("analyst", e.target.value)} />
            </div>
            <div>
              <label className="label">Investment Thesis</label>
              <textarea className="input h-20 resize-none" placeholder="Why are you entering this position?"
                value={form.thesis} onChange={(e) => set("thesis", e.target.value)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" placeholder="Optional notes" value={form.notes}
                onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button type="submit" disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {loading ? "Opening..." : "Open Position"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
