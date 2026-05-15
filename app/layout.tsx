import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MII L/S Fund",
  description: "UVA McIntire Long/Short Hedge Fund Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: "#09090b", color: "#fafafa", minHeight: "100vh" }}>
        <nav className="border-b border-zinc-800 px-6 py-3.5 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-xs font-black text-white">M</div>
              <div>
                <span className="font-bold text-white text-sm">MII L/S Fund</span>
                <span className="text-zinc-600 text-xs ml-2">UVA McIntire</span>
              </div>
            </div>
            <div className="hidden md:flex items-center h-4 border-l border-zinc-800" />
            <div className="hidden md:flex items-center gap-0.5">
              {[
                { href: "/",          label: "Overview" },
                { href: "/positions", label: "Positions" },
                { href: "/trade",     label: "Trade" },
                { href: "/blotter",   label: "Blotter" },
              ].map(({ href, label }) => (
                <a key={href} href={href}
                  className="text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-zinc-800/80 transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>
          <a href="/trade"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md transition-colors">
            + Trade
          </a>
        </nav>
        <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
