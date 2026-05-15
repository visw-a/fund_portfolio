import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "McIntire Investment Institute",
  description: "Long/Short Equity Fund — Internal Portfolio Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <style>{`
          .nav-link:hover { color: #fff !important; background: var(--navy-800) !important; }
          @media (max-width: 768px) { nav { display: none !important; } }
        `}</style>
        <NavBar />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "1.75rem 1.5rem" }}>
          {children}
        </main>
        <footer style={{
          borderTop: "1px solid var(--border)",
          marginTop: "2rem",
          padding: "0.875rem 1.5rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          maxWidth: 1400, margin: "2rem auto 0",
        }}>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            McIntire Investment Institute &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; Internal Use Only
          </span>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Prices via Yahoo Finance &nbsp;·&nbsp; Not Investment Advice
          </span>
        </footer>
      </body>
    </html>
  );
}
