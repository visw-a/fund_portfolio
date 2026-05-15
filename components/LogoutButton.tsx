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
    <button onClick={logout}
      className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-md hover:bg-zinc-800/80 transition-colors">
      Sign out
    </button>
  );
}
