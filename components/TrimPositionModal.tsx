"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Position } from "@/types";

interface Props {
  position: Position;
  onUpdated: () => void;
}

export default function TrimPositionModal({ position, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"trim" | "add">("trim");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState(position.currentPrice?.toString() ?? "");
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/positions/${position.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, shares: parseFloat(shares), price: parseFloat(price), notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOpen(false);
      onUpdated();
    } catch (err) {
      alert("Failed to update position: " + err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors">
          Adjust
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-white mb-1">
            Adjust {position.ticker}
          </Dialog.Title>
          <p className="text-sm text-zinc-400 mb-4">
            Currently holding {position.shares} shares ({position.direction === "L" ? "Long" : "Short"})
          </p>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">Action</label>
              <div className="flex gap-2">
                {(["trim", "add"] as const).map((a) => (
                  <button key={a} type="button"
                    onClick={() => setAction(a)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      action === a
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-zinc-700 text-zinc-400 hover:text-white"
                    }`}>
                    {a === "trim" ? "Trim (reduce)" : "Add (increase)"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Shares</label>
                <input className="input" type="number" step="0.01" placeholder="50" value={shares}
                  onChange={(e) => setShares(e.target.value)} required />
              </div>
              <div>
                <label className="label">Price</label>
                <input className="input" type="number" step="0.01" value={price}
                  onChange={(e) => setPrice(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" placeholder="Reason for adjustment" value={notes}
                onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button type="submit" disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {loading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
