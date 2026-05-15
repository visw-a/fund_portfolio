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
      setError("Access denied. Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--navy-950)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      {/* Subtle grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        opacity: 0.25,
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380 }}>
        {/* Institution badge */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 56, height: 56,
            border: "1px solid var(--blue)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <span style={{ color: "var(--blue)", fontSize: "1.125rem", fontWeight: 700, letterSpacing: "0.05em" }}>MII</span>
          </div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.02em", marginBottom: 4 }}>
            McIntire Investment Institute
          </h1>
          <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Long/Short Equity Fund &nbsp;·&nbsp; University of Virginia
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--navy-900)",
          border: "1px solid var(--border-lt)",
          borderRadius: 2,
          padding: "2rem",
        }}>
          {/* Divider with label */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Restricted Access
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="label">Portal Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter access password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                style={{ borderRadius: 2 }}
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(224, 49, 49, 0.08)",
                border: "1px solid rgba(224, 49, 49, 0.3)",
                borderRadius: 2,
                padding: "0.625rem 0.75rem",
                fontSize: "0.75rem",
                color: "#FF6B6B",
                letterSpacing: "0.02em",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                background: loading || !password ? "var(--navy-700)" : "var(--navy-600)",
                border: "1px solid var(--navy-500)",
                borderRadius: 2,
                color: "#fff",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "0.75rem",
                cursor: loading || !password ? "not-allowed" : "pointer",
                opacity: loading || !password ? 0.6 : 1,
                transition: "background 0.15s",
              }}
            >
              {loading ? "Verifying…" : "Access Portal"}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: "center",
          fontSize: "0.625rem",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginTop: "1.5rem",
        }}>
          Confidential &nbsp;·&nbsp; Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
