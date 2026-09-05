import type { Metadata } from "next";
import Link from "next/link";

import { AdminClubsTable } from "@/components/features/admin/admin-clubs-table";
import { AdminInviteCodes } from "@/components/features/admin/admin-invite-codes";
import { requireSuperAdmin } from "@/lib/auth/helpers";
import { cn } from "@/lib/utils/cn";
import {
  getAdminClubs,
  getCommissionSummary,
  getInviteCodes,
} from "@/server/queries/admin";

export const metadata: Metadata = { title: "HikeIt Admin" };

const TABS = [
  { key: "clubs", label: "Klubet" },
  { key: "codes", label: "Kodet e ftesës" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * Super-admin panel: commission overrides per club, and invite-code
 * management.
 *
 * `requireSuperAdmin()` 404s anyone else — the route must not confirm its own
 * existence to a non-admin. The server actions behind this page re-check the
 * role independently, since a page guard doesn't protect an action endpoint.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireSuperAdmin();

  const { tab: tabParam } = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === tabParam)
    ? (tabParam as TabKey)
    : "clubs";

  const [clubs, codes, summary] = await Promise.all([
    getAdminClubs(),
    getInviteCodes(),
    getCommissionSummary(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="mb-2 text-xs font-bold tracking-[0.15em] text-moss uppercase">
          Kontroll i platformës
        </p>
        <h1 className="font-heading text-3xl font-black tracking-tight text-forest uppercase sm:text-4xl">
          HikeIt Admin
        </h1>
      </div>

      {/* Summary strip — adjacent boxes, no gap. */}
      <div className="grid grid-cols-2 border-2 border-forest lg:grid-cols-4">
        <SummaryBox label="Klube gjithsej" value={summary.totalClubs} />
        <SummaryBox label="Në provë falas" value={summary.onTrial} accent />
        <SummaryBox label="Me komision special" value={summary.onGrant} accent />
        <SummaryBox label="Me 2.5% standard" value={summary.onDefault} last />
      </div>

      {/* Tabs as links so the whole panel stays a Server Component. */}
      <div className="flex border-2 border-forest">
        {TABS.map((t, i) => (
          <Link
            key={t.key}
            href={`/dashboard/admin?tab=${t.key}`}
            className={cn(
              "flex-1 px-5 py-3 text-center text-[12px] font-bold tracking-[0.08em] uppercase transition-colors",
              i > 0 && "border-l-2 border-forest",
              tab === t.key
                ? "bg-forest text-summit"
                : "bg-summit text-forest hover:bg-mist",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "clubs" ? (
        <AdminClubsTable clubs={clubs} />
      ) : (
        <AdminInviteCodes codes={codes} />
      )}
    </div>
  );
}

function SummaryBox({
  label,
  value,
  accent = false,
  last = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-summit p-5",
        !last && "border-r-2 border-forest",
        "border-b-2 border-forest lg:border-b-0",
      )}
    >
      <p className="text-[10px] font-bold tracking-[0.12em] text-forest/50 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "font-heading mt-1 text-3xl font-black tracking-tight",
          accent ? "text-moss" : "text-forest",
        )}
      >
        {value}
      </p>
    </div>
  );
}
