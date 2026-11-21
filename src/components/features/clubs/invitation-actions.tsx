"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  acceptClubInvitation,
  declineClubInvitation,
} from "@/server/actions/clubs";

/** Accept / decline buttons on the /invite/[token] page. */
export function InvitationActions({
  token,
  clubName,
}: {
  token: string;
  clubName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

  async function accept() {
    setPending("accept");
    setError(null);
    const result = await acceptClubInvitation(token);
    if (!result.success || !result.slug) {
      setPending(null);
      setError(result.error ?? "Diçka shkoi keq. Ju lutemi provoni sërish.");
      return;
    }
    router.push(`/clubs/${result.slug}`);
    router.refresh();
  }

  async function decline() {
    setPending("decline");
    setError(null);
    const result = await declineClubInvitation(token);
    setPending(null);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq. Ju lutemi provoni sërish.");
      return;
    }
    setDeclined(true);
  }

  if (declined) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        E refuzuat ftesën nga {clubName}. Nuk do të shtoheni në klub.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        size="lg"
        onClick={accept}
        disabled={pending !== null}
      >
        {pending === "accept" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Check />
        )}
        Prano ftesën
      </Button>
      <Button
        className="w-full"
        variant="outline"
        onClick={decline}
        disabled={pending !== null}
      >
        {pending === "decline" ? <Loader2 className="animate-spin" /> : <X />}
        Refuzo
      </Button>
      {error ? (
        <p className="text-destructive text-center text-sm">{error}</p>
      ) : null}
    </div>
  );
}
