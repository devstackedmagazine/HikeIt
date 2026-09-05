"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type CommissionSource,
  commissionSourceLabels,
  formatRatePercent,
} from "@/lib/commission";
import { cn } from "@/lib/utils/cn";
import { formatTripDate } from "@/lib/utils/datetime";
import {
  clearClubCommission,
  setClubCommission,
} from "@/server/actions/admin-commission";
import type { AdminClubRow } from "@/server/queries/admin";

/** Moss for anything discounted, plain Forest for the standard rate. */
function sourceTone(source: CommissionSource): string {
  return source === "default" ? "text-forest/60" : "text-moss";
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
              <Th align="right">Komisioni</Th>
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
                      "font-heading text-[15px] font-black",
                      sourceTone(club.source),
                    )}
                  >
                    {formatRatePercent(club.rate)}
                  </span>
                </Td>
                <Td>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-[0.08em] uppercase",
                      sourceTone(club.source),
                    )}
                  >
                    {commissionSourceLabels[club.source]}
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
                    Menaxho komisionin
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <CommissionDialog
          club={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

/**
 * Set / clear a club's commission override.
 *
 * The rate is entered as a percentage and converted to a decimal server-side;
 * "PËRGJITHMONË" sends a null expiry, which the resolver reads as a permanent
 * grant.
 */
function CommissionDialog({
  club,
  onClose,
}: {
  club: AdminClubRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [ratePercent, setRatePercent] = useState(
    club.commissionRate !== null
      ? String(Number(club.commissionRate) * 100)
      : "0",
  );
  const [permanent, setPermanent] = useState(
    club.commissionOverrideUntil === null,
  );
  const [until, setUntil] = useState(
    club.commissionOverrideUntil
      ? toDateInputValue(club.commissionOverrideUntil)
      : "",
  );
  const [note, setNote] = useState(club.commissionOverrideNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasOverride = club.commissionRate !== null;

  async function save() {
    setError(null);
    const parsedRate = Number(ratePercent);
    if (!Number.isFinite(parsedRate)) {
      setError("Shkruani një numër të vlefshëm.");
      return;
    }
    if (!permanent && !until) {
      setError("Zgjidhni një datë ose caktoni 'Përgjithmonë'.");
      return;
    }

    setSaving(true);
    const result = await setClubCommission({
      organizationId: club.id,
      ratePercent: parsedRate,
      // End of the chosen day, so a grant "until the 30th" covers the 30th.
      until: permanent ? null : new Date(`${until}T23:59:59`).toISOString(),
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

  async function clear() {
    setError(null);
    setSaving(true);
    const result = await clearClubCommission(club.id);
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
              Menaxho komisionin
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-[13px] text-forest/60">
              {club.name} — aktualisht {formatRatePercent(club.rate)} (
              {commissionSourceLabels[club.source].toLowerCase()})
            </Dialog.Description>
          </div>

          <div className="space-y-4 p-5">
            <Field label="Norma e komisionit (%)">
              <input
                type="number"
                min={0}
                max={2.5}
                step={0.1}
                value={ratePercent}
                onChange={(e) => setRatePercent(e.target.value)}
                className="w-full border-2 border-forest bg-summit px-3 py-2.5 text-[14px] font-bold text-forest outline-none focus-visible:border-moss"
              />
              <p className="mt-1.5 text-[11px] text-forest/50">
                0 = pa komision. Maksimumi 2.5% (norma standarde).
              </p>
            </Field>

            <Field label="Kohëzgjatja">
              <div className="flex border-2 border-forest">
                <button
                  type="button"
                  onClick={() => setPermanent(true)}
                  className={cn(
                    "flex-1 px-3 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase transition-colors",
                    permanent
                      ? "bg-forest text-summit"
                      : "bg-summit text-forest hover:bg-mist",
                  )}
                >
                  Përgjithmonë
                </button>
                <button
                  type="button"
                  onClick={() => setPermanent(false)}
                  className={cn(
                    "flex-1 border-l-2 border-forest px-3 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase transition-colors",
                    !permanent
                      ? "bg-forest text-summit"
                      : "bg-summit text-forest hover:bg-mist",
                  )}
                >
                  Deri në datë
                </button>
              </div>
              {!permanent ? (
                <input
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="mt-2 w-full border-2 border-forest bg-summit px-3 py-2.5 text-[14px] font-bold text-forest outline-none focus-visible:border-moss"
                />
              ) : null}
            </Field>

            <Field label="Shënim (opsional)">
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="P.sh. partneritet me Federatën e Alpinizmit"
                className="w-full resize-none border-2 border-forest bg-summit px-3 py-2.5 text-[13px] text-forest outline-none focus-visible:border-moss"
              />
            </Field>

            {error ? (
              <p className="text-[13px] font-medium text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-between gap-2 border-t-2 border-forest p-5">
            {hasOverride ? (
              <button
                type="button"
                onClick={clear}
                disabled={saving}
                className="border-2 border-danger bg-summit px-4 py-2.5 text-[11px] font-bold tracking-[0.06em] text-danger uppercase transition-colors hover:bg-danger hover:text-summit disabled:opacity-50"
              >
                Hiq mbivendosjen
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

/** `Date` → the `yyyy-mm-dd` a native date input expects, in local time. */
function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
