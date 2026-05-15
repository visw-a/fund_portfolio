"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-xl font-black text-white mx-auto mb-4">M</div>
          <h1 className="text-xl font-bold text-white">MII L/S Fund</h1>
          <p className="text-sm text-zinc-500 mt-1">UVA McIntire · Internal Portal</p>
        </div>

        <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="label">Access Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-700 mt-6">
          MII Long/Short Equity Fund · Restricted Access
        </p>
      </div>
    </div>
  );
}
