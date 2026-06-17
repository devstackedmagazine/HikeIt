"use client";

import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { joinClub } from "@/server/actions/clubs";

export function JoinClubButton({
  organizationId,
  slug,
  isLoggedIn,
  className,
}: {
  organizationId: string;
  slug: string;
  isLoggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <Button
        className={className}
        render={<Link href={`/login?redirect=/clubs/${slug}`} />}
      >
        <UserPlus />
        Bëhu anëtar
      </Button>
    );
  }

  async function handleJoin() {
    setLoading(true);
    setError(null);
    const result = await joinClub(organizationId);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    router.refresh();
  }

  return (
    <div className={className}>
      <Button onClick={handleJoin} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin" /> : <UserPlus />}
        Bëhu anëtar
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
