"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={logout} style={{
      color: "var(--text-muted)",
      fontSize: "0.7rem",
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "0.375rem 0.75rem",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      borderRadius: 2,
      transition: "color 0.15s",
    }}
    onMouseEnter={e => (e.target as HTMLElement).style.color = "var(--text-secondary)"}
    onMouseLeave={e => (e.target as HTMLElement).style.color = "var(--text-muted)"}
    >
      Sign Out
    </button>
  );
}
