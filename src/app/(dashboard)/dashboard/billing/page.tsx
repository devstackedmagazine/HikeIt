import { Check } from "lucide-react";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ManageBillingButton } from "@/components/features/billing/manage-billing-button";
import { UpgradeButton } from "@/components/features/billing/upgrade-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequiredUser, getUserAdminClub } from "@/lib/auth/helpers";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";

export const metadata: Metadata = { title: "Faturimi" };

const TIER_LABEL: Record<string, string> = {
  free: "Falas",
  pro: "Pro",
  team: "Team",
};

const PRO_FEATURES = [
  "Anëtarë të pakufizuar",
  "Udhëtime të pakufizuara",
  "Mbledh pagesa online",
  "Dashboard analitike",
  "Suport me email",
];

interface InvoiceRow {
  id: string;
  amount: number;
  date: number;
  url: string | null;
}

async function recentInvoices(customerId: string): Promise<InvoiceRow[]> {
  try {
    const invoices = await getStripe().invoices.list({
      customer: customerId,
      limit: 3,
    });
    return invoices.data.map((inv) => ({
      id: inv.id ?? "",
      amount: inv.amount_paid,
      date: inv.created,
      url: inv.hosted_invoice_url ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function BillingPage() {
  const user = await getRequiredUser();
  const club = await getUserAdminClub(user.id);

  if (!club) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Faturimi</h1>
        <EmptyState
          icon={Building2}
          title="Ende pa klub"
          description="Krijo klubin tënd për të menaxhuar abonimin."
          action={{ label: "Krijo klubin", href: "/dashboard/club/create" }}
        />
      </div>
    );
  }

  const tier = club.subscriptionTier;
  const isPaid = tier === "pro" || tier === "team";
  const invoices =
    isPaid && club.stripeCustomerId && isStripeConfigured()
      ? await recentInvoices(club.stripeCustomerId)
      : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Faturimi</h1>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Plani aktual
            <Badge variant={isPaid ? "default" : "secondary"}>
              {TIER_LABEL[tier] ?? tier}
            </Badge>
          </CardTitle>
          {club.subscriptionStatus ? (
            <CardDescription>
              Statusi: {club.subscriptionStatus}
              {club.trialEndsAt
                ? ` · Prova mbaron ${new Intl.DateTimeFormat("sq-AL").format(
                    club.trialEndsAt,
                  )}`
                : ""}
            </CardDescription>
          ) : null}
        </CardHeader>
        {isPaid ? (
          <CardContent className="space-y-4">
            <ManageBillingButton organizationId={club.id} />
            {invoices.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium">Faturat e fundit</p>
                <ul className="space-y-1 text-sm">
                  {invoices.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between border-b pb-1"
                    >
                      <span className="text-muted-foreground">
                        {new Intl.DateTimeFormat("sq-AL").format(
                          new Date(inv.date * 1000),
                        )}{" "}
                        · €{(inv.amount / 100).toFixed(2)}
                      </span>
                      {inv.url ? (
                        <a
                          href={inv.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Shkarko Faturën
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      {/* Upgrade CTA for free tier */}
      {!isPaid ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Kaloni te Pro</CardTitle>
            <CardDescription>
              Zhblloko të gjitha veçoritë për klubin tënd.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              <UpgradeButton
                organizationId={club.id}
                tier="pro"
                interval="monthly"
                label="Pro €19/muaj"
              />
              <UpgradeButton
                organizationId={club.id}
                tier="pro"
                interval="yearly"
                label="Pro €190/vit"
                variant="outline"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Përfshin provë falas 14-ditore. Për Team, na{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
                render={<Link href="mailto:hello@hikeit.app" />}
              >
                kontaktoni
              </Button>
              .
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
