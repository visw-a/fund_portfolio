"use client";

import LogoutButton from "./LogoutButton";

const NAV_LINKS = [
  { href: "/",          label: "Overview"  },
  { href: "/positions", label: "Positions" },
  { href: "/trade",     label: "Trade"     },
  { href: "/blotter",   label: "Blotter"   },
];

export default function NavBar() {
  return (
    <header style={{
      background: "var(--navy-900)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: "2px",
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem",
        height: 58, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo + fund name */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.875rem", textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36,
            border: "1px solid var(--gold)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ color: "var(--gold)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em" }}>MII</span>
          </div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.875rem", letterSpacing: "0.02em", lineHeight: 1.2 }}>
              McIntire Investment Institute
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
              Long/Short Equity Fund &nbsp;·&nbsp; University of Virginia
            </div>
          </div>
        </a>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.125rem" }}>
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href}
              className="nav-link"
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0.375rem 0.875rem",
                textDecoration: "none",
                borderRadius: 1,
                transition: "color 0.15s, background 0.15s",
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a href="/trade" style={{
            background: "var(--navy-600)",
            border: "1px solid var(--navy-500)",
            color: "#fff",
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "0.4rem 1rem", textDecoration: "none", borderRadius: 2,
            transition: "background 0.15s",
          }}>
            + Trade
          </a>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
