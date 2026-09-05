"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

/** Signs the user out and returns them to the login page. */
export function LogoutButton({
  variant = "outline",
}: {
  variant?: "outline" | "ghost" | "default" | "brutalist";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  if (variant === "brutalist") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-none border-2 border-forest bg-summit py-3 text-[12px] font-extrabold tracking-[0.08em] text-forest uppercase transition-colors hover:bg-forest hover:text-summit disabled:opacity-50"
      >
        <LogOut className="size-4" />
        {loading ? "Duke dalë…" : "Dil nga llogaria"}
      </button>
    );
  }

  return (
    <Button variant={variant} onClick={handleLogout} disabled={loading}>
      <LogOut />
      {loading ? "Logging out…" : "Log out"}
    </Button>
  );
}
