"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organization } from "@/lib/db/schema";
import { resolveEntitlement } from "@/lib/entitlements";
import { formatTripDate } from "@/lib/utils/datetime";
import { redeemInviteCodeForClub } from "@/server/actions/clubs";

/**
 * Redeem a partnership code from an existing club's settings.
 *
 * Same redemption path as club creation (`redeemInviteCodeForClub` calls the
 * identical atomic claim `createClub` uses), just reachable after the club
 * already exists. The current trial state is shown alongside the input so an
 * admin sees exactly what redeeming will change, and the page refreshes on
 * success so that state reflects the new date immediately.
 */
export function ClubInviteCode({ club }: { club: Organization }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const entitlement = resolveEntitlement(club);

  async function redeem() {
    if (!code.trim()) return;
    setRedeeming(true);
    setMessage(null);
    setSuccess(false);

    const result = await redeemInviteCodeForClub(club.slug, code);
    setRedeeming(false);

    if (!result.success) {
      setMessage(result.error ?? "Diçka shkoi keq.");
      return;
    }
    setSuccess(true);
    setMessage("Kodi u aplikua — prova u shtua.");
    setCode("");
    router.refresh();
  }

  return (
    <Card id="invite-code">
      <CardHeader>
        <CardTitle>Kod ftese</CardTitle>
        <CardDescription>
          Një kod partneriteti shton muaj shtesë prove Pro, mbi atë që klubi ka
          tashmë.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-input bg-muted/40 space-y-1 border p-3 text-sm">
          <p className="text-muted-foreground text-xs tracking-[0.08em] uppercase">
            Gjendja aktuale
          </p>
          <p className="font-medium">
            {entitlement.source === "subscription"
              ? "Klubi ka abonim aktiv Pro/Team."
              : entitlement.source === "trial" && entitlement.endsAt
                ? `Provë Pro deri më ${formatTripDate(entitlement.endsAt)}`
                : "Asnjë provë aktive — klubi është në planin falas."}
          </p>
          {club.inviteCodeUsed ? (
            <p className="text-muted-foreground text-xs">
              Kodi i fundit i përdorur: {club.inviteCodeUsed}
            </p>
          ) : null}
          {entitlement.source === "subscription" ? (
            <p className="text-muted-foreground text-xs">
              Muajt e shtuar nga kodi nuk ndryshojnë asgjë tani, por mbeten si
              rrjet sigurie nëse abonimi ndërpritet më vonë.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label>Kod</Label>
          <Input
            className="h-9 uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="P.SH. HIKEIT-PARTNER"
          />
        </div>

        {message ? (
          <p
            className={
              success
                ? "text-primary text-sm font-medium"
                : "text-destructive text-sm"
            }
            role={success ? undefined : "alert"}
          >
            {message}
          </p>
        ) : null}

        <Button onClick={redeem} disabled={redeeming || !code.trim()}>
          {redeeming ? <Loader2 className="animate-spin" /> : null}
          Përdor kodin
        </Button>
      </CardContent>
    </Card>
  );
}
