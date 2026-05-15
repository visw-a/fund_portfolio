"use client";

import Image from "next/image";
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
      top: "3px",
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem",
        height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "1.5rem",
      }}>

        {/* Logo + name */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.875rem", textDecoration: "none", flexShrink: 0 }}>
          <Image
            src="/bull-logo.png"
            alt="McIntire Investment Institute"
            width={40}
            height={28}
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.9 }}
          />
          <div>
            <div style={{
              color: "var(--text-primary)", fontWeight: 700, fontSize: "15px",
              letterSpacing: "0.01em", lineHeight: 1.2,
            }}>
              McIntire Investment Institute
            </div>
            <div style={{
              color: "var(--text-muted)", fontSize: "10px",
              letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2,
            }}>
              Long/Short Equity Fund &nbsp;·&nbsp; University of Virginia
            </div>
          </div>
        </a>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "var(--border-lt)", flexShrink: 0 }} />

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="nav-link" style={{
              color: "var(--text-secondary)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "5px 12px",
              textDecoration: "none",
              borderRadius: 2,
              transition: "color 0.15s, background 0.15s",
            }}>
              {label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <a href="/trade" style={{
            background: "var(--navy-500)",
            border: "1px solid var(--navy-400)",
            color: "#fff",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "6px 14px", textDecoration: "none", borderRadius: 2,
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
