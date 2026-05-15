"use client";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
}

export default function StatCard({ label, value, sub, positive }: StatCardProps) {
  const valueColor =
    positive === true ? "text-emerald-400" :
    positive === false ? "text-red-400" :
    "text-white";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
