"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type EntitlementSource,
  entitlementSourceLabels,
  type EntitlementTier,
} from "@/lib/entitlements";
import { cn } from "@/lib/utils/cn";
import { formatTripDate } from "@/lib/utils/datetime";
import { endClubTrial, extendClubTrial } from "@/server/actions/admin-trial";
import type { AdminClubRow } from "@/server/queries/admin";

const TIER_LABEL: Record<EntitlementTier, string> = {
  free: "Falas",
  pro: "Pro",
  team: "Team",
};

/** Moss for anything above the free tier, plain Forest for free. */
function sourceTone(source: EntitlementSource): string {
  return source === "free" ? "text-forest/60" : "text-moss";
}

export function AdminClubsTable({ clubs }: { clubs: AdminClubRow[] }) {
  const [editing, setEditing] = useState<AdminClubRow | null>(null);

  if (clubs.length === 0) {
    return (
      <p className="border-2 border-forest bg-summit p-8 text-center text-[13px] text-forest/60">
        Asnjë klub.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto border-2 border-forest">
        <table className="w-full min-w-[860px] border-collapse bg-summit">
          <thead>
            <tr className="bg-forest text-summit">
              <Th>Klubi</Th>
              <Th>Qyteti</Th>
              <Th align="right">Anëtarë</Th>
              <Th align="right">Plani</Th>
              <Th>Burimi</Th>
              <Th>Deri më</Th>
              <Th align="right">Veprim</Th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr
                key={club.id}
                className="border-t-2 border-forest/15 align-middle"
              >
                <Td>
                  <span className="font-bold text-forest">{club.name}</span>
                  {club.inviteCodeUsed ? (
                    <span className="mt-0.5 block text-[10px] tracking-[0.06em] text-forest/40 uppercase">
                      Kod: {club.inviteCodeUsed}
                    </span>
                  ) : null}
                </Td>
                <Td>{club.city ?? "—"}</Td>
                <Td align="right">{club.memberCount}</Td>
                <Td align="right">
                  <span
                    className={cn(
                      "font-heading text-[15px] font-black uppercase",
                      sourceTone(club.source),
                    )}
                  >
                    {TIER_LABEL[club.tier]}
                  </span>
                </Td>
                <Td>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-[0.08em] uppercase",
                      sourceTone(club.source),
                    )}
                  >
                    {entitlementSourceLabels[club.source]}
                  </span>
                </Td>
                <Td>
                  {club.endsAt ? formatTripDate(club.endsAt) : "Pa afat"}
                </Td>
                <Td align="right">
                  <button
                    type="button"
                    onClick={() => setEditing(club)}
                    className="border-2 border-forest bg-summit px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] text-forest uppercase transition-colors hover:bg-forest hover:text-summit"
                  >
                    Zgjat provën
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <TrialDialog club={editing} onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}

/**
 * Extend or end a club's free trial.
 *
 * Months are counted from whichever is later — today, or the trial already
 * running — so "3 months" always adds runway and never removes it. The note is
 * recorded in `audit_logs` only; there is no column for it, because nothing in
 * the product reads it and a grant's justification belongs with the record of
 * who made it.
 */
function TrialDialog({
  club,
  onClose,
}: {
  club: AdminClubRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [months, setMonths] = useState("3");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasTrial = club.source === "trial";

  async function save() {
    setError(null);
    const parsedMonths = Number(months);
    if (!Number.isInteger(parsedMonths) || parsedMonths < 1) {
      setError("Shkruani një numër të plotë muajsh.");
      return;
    }

    setSaving(true);
    const result = await extendClubTrial({
      organizationId: club.id,
      months: parsedMonths,
      note,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    onClose();
    router.refresh();
  }

  async function end() {
    setError(null);
    setSaving(true);
    const result = await endClubTrial(club.id);
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-abyss/70 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90svh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-forest bg-summit outline-none sm:max-w-md">
          <div className="border-b-2 border-forest p-5">
            <Dialog.Title className="font-heading text-[16px] font-black tracking-tight text-forest uppercase">
              Zgjat provën
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-[13px] text-forest/60">
              {club.name} — aktualisht {TIER_LABEL[club.tier]} (
              {entitlementSourceLabels[club.source].toLowerCase()})
              {club.trialEndsAt
                ? `, deri më ${formatTripDate(club.trialEndsAt)}`
                : ""}
            </Dialog.Description>
          </div>

          <div className="space-y-4 p-5">
            <Field label="Muaj shtesë">
              <input
                type="number"
                min={1}
                max={120}
                step={1}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="w-full border-2 border-forest bg-summit px-3 py-2.5 text-[14px] font-bold text-forest outline-none focus-visible:border-moss"
              />
              <p className="mt-1.5 text-[11px] text-forest/50">
                Numërohen nga sot, ose nga fundi i provës aktuale nëse është
                ende në vazhdim. Prova jep qasje të plotë Pro.
              </p>
            </Field>

            <Field label="Shënim (opsional)">
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="P.sh. partneritet me Federatën e Alpinizmit"
                className="w-full resize-none border-2 border-forest bg-summit px-3 py-2.5 text-[13px] text-forest outline-none focus-visible:border-moss"
              />
              <p className="mt-1.5 text-[11px] text-forest/50">
                Ruhet vetëm në regjistrin e veprimeve.
              </p>
            </Field>

            {error ? (
              <p className="text-[13px] font-medium text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-between gap-2 border-t-2 border-forest p-5">
            {hasTrial ? (
              <button
                type="button"
                onClick={end}
                disabled={saving}
                className="border-2 border-danger bg-summit px-4 py-2.5 text-[11px] font-bold tracking-[0.06em] text-danger uppercase transition-colors hover:bg-danger hover:text-summit disabled:opacity-50"
              >
                Përfundo provën
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Dialog.Close
                render={
                  <button
                    type="button"
                    disabled={saving}
                    className="border-2 border-forest bg-summit px-4 py-2.5 text-[11px] font-bold tracking-[0.06em] text-forest uppercase transition-colors hover:bg-mist disabled:opacity-50"
                  />
                }
              >
                Anulo
              </Dialog.Close>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 border-2 border-forest bg-forest px-4 py-2.5 text-[11px] font-bold tracking-[0.06em] text-summit uppercase transition-colors hover:bg-pine disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Ruaj
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold tracking-[0.12em] text-forest/60 uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[10px] font-bold tracking-[0.12em] uppercase",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-[13px] text-forest/80",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </td>
  );
}
