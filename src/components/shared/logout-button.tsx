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
  variant?: "outline" | "ghost" | "default";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant={variant} onClick={handleLogout} disabled={loading}>
      <LogOut />
      {loading ? "Logging out…" : "Log out"}
    </Button>
  );
}
