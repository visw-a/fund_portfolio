"use client";

import { useEffect, useState } from "react";
import { Transaction } from "@/types";
import { fmt$, fmtNum } from "@/lib/calculations";

const ACTION_STYLE: Record<string, string> = {
  open:  "bg-blue-900/30 text-blue-400",
  add:   "bg-emerald-900/30 text-emerald-400",
  trim:  "bg-amber-900/30 text-amber-400",
  close: "bg-red-900/30 text-red-400",
};

export default function BlotterPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((d: Transaction[]) => { setTransactions([...d].reverse()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Blotter</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Complete audit log of all portfolio transactions</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm animate-pulse">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Ticker</th>
                  <th className="pb-3 pr-4">Dir</th>
                  <th className="pb-3 pr-4">Action</th>
                  <th className="pb-3 pr-4 text-right">Shares</th>
                  <th className="pb-3 pr-4 text-right">Price</th>
                  <th className="pb-3 pr-4 text-right">Trade Value</th>
                  <th className="pb-3 pr-4 text-right">Cash Flow</th>
                  <th className="pb-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3 pr-4 font-mono text-zinc-400 text-xs whitespace-nowrap">{t.date}</td>
                    <td className="py-3 pr-4 font-mono font-semibold text-white">{t.ticker}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold ${t.direction === "L" ? "text-emerald-400" : "text-red-400"}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${ACTION_STYLE[t.action] ?? ""}`}>
                        {t.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-zinc-300">{fmtNum(t.shares, 2)}</td>
                    <td className="py-3 pr-4 text-right font-mono text-zinc-300">{fmt$(t.price, 2)}</td>
                    <td className="py-3 pr-4 text-right font-mono text-zinc-300">{fmt$(t.shares * t.price, 0)}</td>
                    <td className={`py-3 pr-4 text-right font-mono font-medium ${t.cashFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {t.cashFlow !== 0 ? (t.cashFlow >= 0 ? "+" : "") + fmt$(t.cashFlow, 0) : "—"}
                    </td>
                    <td className="py-3 text-zinc-500 text-xs">{t.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
