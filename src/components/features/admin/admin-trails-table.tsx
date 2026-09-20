"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { difficultyLabels } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils/cn";
import { timeAgo } from "@/lib/utils/datetime";
import { approveTrail, rejectTrail } from "@/server/actions/admin-trails";
import type { UnverifiedTrailRow } from "@/server/queries/admin";

export function AdminTrailsTable({ trails }: { trails: UnverifiedTrailRow[] }) {
  const [rejecting, setRejecting] = useState<UnverifiedTrailRow | null>(null);

  if (trails.length === 0) {
    return (
      <p className="border-forest bg-summit text-forest/60 border-2 p-8 text-center text-[13px]">
        Asnjë shteg në pritje të rishikimit.
      </p>
    );
  }

  return (
    <>
      <div className="border-forest overflow-x-auto border-2">
        <table className="bg-summit w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="bg-forest text-summit">
              <Th>Shtegu</Th>
              <Th>Rajoni</Th>
              <Th>Vështirësia</Th>
              <Th align="right">Distanca</Th>
              <Th align="right">Ngritja</Th>
              <Th>GPX</Th>
              <Th>Dërguar nga</Th>
              <Th>Kur</Th>
              <Th align="right">Veprim</Th>
            </tr>
          </thead>
          <tbody>
            {trails.map((trail) => (
              <TrailRow
                key={trail.id}
                trail={trail}
                onReject={() => setRejecting(trail)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {rejecting ? (
        <RejectDialog trail={rejecting} onClose={() => setRejecting(null)} />
      ) : null}
    </>
  );
}

function TrailRow({
  trail,
  onReject,
}: {
  trail: UnverifiedTrailRow;
  onReject: () => void;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setError(null);
    setApproving(true);
    const result = await approveTrail(trail.id);
    setApproving(false);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    router.refresh();
  }

  return (
    <tr className="border-forest/15 border-t-2 align-middle">
      <Td>
        <span className="text-forest font-bold">{trail.name}</span>
        {error ? (
          <span className="text-danger mt-0.5 block text-[10px] font-medium">
            {error}
          </span>
        ) : null}
      </Td>
      <Td>{trail.region ?? "—"}</Td>
      <Td>{difficultyLabels[trail.difficulty] ?? trail.difficulty}</Td>
      <Td align="right">{trail.distanceKm ? `${trail.distanceKm} km` : "—"}</Td>
      <Td align="right">
        {trail.elevationGainM != null ? `${trail.elevationGainM} m` : "—"}
      </Td>
      <Td>
        <span
          className={cn(
            "text-[10px] font-bold tracking-[0.08em] uppercase",
            trail.hasGpx ? "text-moss" : "text-forest/40",
          )}
        >
          {trail.hasGpx ? "Po" : "Jo"}
        </span>
      </Td>
      <Td>
        {trail.submittedByName ?? trail.submittedByEmail ?? "—"}
        {trail.submittedByName && trail.submittedByEmail ? (
          <span className="text-forest/40 mt-0.5 block text-[10px]">
            {trail.submittedByEmail}
          </span>
        ) : null}
      </Td>
      <Td>{timeAgo(trail.createdAt)}</Td>
      <Td align="right">
        <div className="flex justify-end gap-1.5">
          <Link
            href={`/trails/${trail.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-forest bg-summit text-forest hover:bg-mist border-2 px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors"
          >
            Shiko
          </Link>
          <button
            type="button"
            onClick={approve}
            disabled={approving}
            className="border-moss bg-moss text-abyss hover:bg-pine hover:text-summit flex items-center gap-1 border-2 px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors disabled:opacity-50"
          >
            {approving ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Check className="size-3" />
            )}
            Aprovo
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={approving}
            className="border-danger bg-summit text-danger hover:bg-danger hover:text-summit flex items-center gap-1 border-2 px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors disabled:opacity-50"
          >
            <X className="size-3" />
            Refuzo
          </button>
        </div>
      </Td>
    </tr>
  );
}

/**
 * Confirmation step for rejection — the one destructive-feeling decision
 * here, even though nothing is actually deleted (see `rejectTrail`). The
 * reason is optional and recorded only in `audit_logs`, same as the note
 * field on the trial-extension dialog.
 */
function RejectDialog({
  trail,
  onClose,
}: {
  trail: UnverifiedTrailRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setSaving(true);
    const result = await rejectTrail(trail.id, reason);
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
        <Dialog.Backdrop className="bg-abyss/70 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50" />
        <Dialog.Popup className="border-forest bg-summit fixed top-1/2 left-1/2 z-50 max-h-[90svh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 outline-none sm:max-w-md">
          <div className="border-forest border-b-2 p-5">
            <Dialog.Title className="font-heading text-forest text-[16px] font-black tracking-tight uppercase">
              Refuzo shtegun
            </Dialog.Title>
            <Dialog.Description className="text-forest/60 mt-1 text-[13px]">
              {trail.name} nuk do të bëhet publik. Shtegu dhe skedari GPX i tij
              nuk fshihen — vetëm mbeten të pariverifikuar.
            </Dialog.Description>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <p className="text-forest/60 mb-1.5 text-[10px] font-bold tracking-[0.12em] uppercase">
                Arsyeja (opsionale)
              </p>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="P.sh. koordinata të gabuara, dyfishim i një shtegu ekzistues"
                className="border-forest bg-summit text-forest focus-visible:border-moss w-full resize-none border-2 px-3 py-2.5 text-[13px] outline-none"
              />
              <p className="text-forest/50 mt-1.5 text-[11px]">
                Ruhet vetëm në regjistrin e veprimeve.
              </p>
            </div>

            {error ? (
              <p className="text-danger text-[13px] font-medium" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="border-forest flex justify-end gap-2 border-t-2 p-5">
            <Dialog.Close
              render={
                <button
                  type="button"
                  disabled={saving}
                  className="border-forest bg-summit text-forest hover:bg-mist border-2 px-4 py-2.5 text-[11px] font-bold tracking-[0.06em] uppercase transition-colors disabled:opacity-50"
                />
              }
            >
              Anulo
            </Dialog.Close>
            <button
              type="button"
              onClick={confirm}
              disabled={saving}
              className="border-danger bg-danger text-summit flex items-center gap-2 border-2 px-4 py-2.5 text-[11px] font-bold tracking-[0.06em] uppercase transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Refuzo shtegun
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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
        "text-forest/80 px-4 py-3 text-[13px]",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </td>
  );
}
