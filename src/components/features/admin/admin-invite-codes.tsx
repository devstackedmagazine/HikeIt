"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import { formatTripDate } from "@/lib/utils/datetime";
import {
  createInviteCode,
  toggleInviteCode,
} from "@/server/actions/admin-trial";
import type { InviteCodeRow, InviteCodeStatus } from "@/server/queries/admin";

/** Characters used for generated codes — no 0/O/1/I, which get misread. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const STATUS_LABELS: Record<InviteCodeStatus, string> = {
  active: "Aktiv",
  inactive: "Joaktiv",
  expired: "Skaduar",
  exhausted: "Shfrytëzuar",
};

const STATUS_TONE: Record<InviteCodeStatus, string> = {
  active: "text-moss",
  inactive: "text-forest/40",
  expired: "text-alert",
  exhausted: "text-alert",
};

function generateCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const body = Array.from(
    bytes,
    (b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
  ).join("");
  return `HIKEIT-${body}`;
}

export function AdminInviteCodes({ codes }: { codes: InviteCodeRow[] }) {
  return (
    <div className="space-y-6">
      <CreateCodeForm />
      <CodesTable codes={codes} />
    </div>
  );
}

function CreateCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [trialMonths, setTrialMonths] = useState("3");
  const [paddleDiscountId, setPaddleDiscountId] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSuccess(null);

    const parsedMonths = Number(trialMonths);
    if (!Number.isInteger(parsedMonths) || parsedMonths < 1) {
      setError("Muajt duhet të jenë numër i plotë.");
      return;
    }

    setSaving(true);
    const result = await createInviteCode({
      code,
      trialMonths: parsedMonths,
      paddleDiscountId: paddleDiscountId.trim() || undefined,
      // Empty means "no limit" for each of these, which the schema and DB
      // both represent as NULL.
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    setSuccess(`Kodi ${code.toUpperCase()} u krijua.`);
    setCode("");
    setTrialMonths("3");
    setPaddleDiscountId("");
    setMaxUses("");
    setExpiresAt("");
    router.refresh();
  }

  return (
    <div className="border-2 border-forest bg-summit">
      <div className="border-b-2 border-forest p-5">
        <h2 className="font-heading text-[15px] font-black tracking-tight text-forest uppercase">
          Krijo kod të ri
        </h2>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kodi">
            <div className="flex">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="HIKEIT-PARTNER"
                className="min-w-0 flex-1 border-2 border-forest bg-summit px-3 py-2.5 text-[14px] font-bold text-forest uppercase outline-none focus-visible:border-moss"
              />
              <button
                type="button"
                onClick={() => setCode(generateCode())}
                title="Gjenero kod"
                className="flex items-center gap-1.5 border-2 border-l-0 border-forest bg-forest px-3 py-2.5 text-[10px] font-bold tracking-[0.06em] text-summit uppercase transition-colors hover:bg-pine"
              >
                <RefreshCw className="size-3.5" />
                Gjenero
              </button>
            </div>
          </Field>

          <Field label="Muaj provë">
            <input
              type="number"
              min={1}
              max={120}
              step={1}
              value={trialMonths}
              onChange={(e) => setTrialMonths(e.target.value)}
              className="w-full border-2 border-forest bg-summit px-3 py-2.5 text-[14px] font-bold text-forest outline-none focus-visible:border-moss"
            />
            <p className="mt-1.5 text-[11px] text-forest/50">
              Qasje e plotë Pro, në vend të provës standarde 3-mujore.
            </p>
          </Field>

          <Field label="Paddle discount ID (opsional)">
            <input
              type="text"
              value={paddleDiscountId}
              onChange={(e) => setPaddleDiscountId(e.target.value)}
              placeholder="dsc_..."
              className="w-full border-2 border-forest bg-summit px-3 py-2.5 text-[14px] font-bold text-forest outline-none focus-visible:border-moss"
            />
            <p className="mt-1.5 text-[11px] text-forest/50">
              Zbritja aplikohet në Paddle nëse klubi abonohet. Bosh = vetëm
              provë e zgjatur.
            </p>
          </Field>

          <Field label="Përdorime maksimale">
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Bosh = të pakufizuara"
              className="w-full border-2 border-forest bg-summit px-3 py-2.5 text-[14px] font-bold text-forest outline-none focus-visible:border-moss"
            />
          </Field>

          <Field label="Skadon më (opsionale)">
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border-2 border-forest bg-summit px-3 py-2.5 text-[14px] font-bold text-forest outline-none focus-visible:border-moss"
            />
          </Field>
        </div>

        {error ? (
          <p className="text-[13px] font-medium text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-[13px] font-bold text-moss">{success}</p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={saving || !code}
          className="flex items-center gap-2 border-2 border-forest bg-forest px-6 py-3 text-[12px] font-bold tracking-[0.06em] text-summit uppercase transition-colors hover:bg-pine disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Krijo kodin
        </button>
      </div>
    </div>
  );
}

function CodesTable({ codes }: { codes: InviteCodeRow[] }) {
  if (codes.length === 0) {
    return (
      <p className="border-2 border-forest bg-summit p-8 text-center text-[13px] text-forest/60">
        Asnjë kod i krijuar ende.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border-2 border-forest">
      <table className="w-full min-w-[820px] border-collapse bg-summit">
        <thead>
          <tr className="bg-forest text-summit">
            <Th>Kodi</Th>
            <Th align="right">Muaj provë</Th>
            <Th>Zbritje Paddle</Th>
            <Th align="right">Përdorime</Th>
            <Th>Skadon</Th>
            <Th>Statusi</Th>
            <Th align="right">Veprim</Th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => (
            <CodeRow key={code.id} code={code} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeRow({ code }: { code: InviteCodeRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    await toggleInviteCode(code.id, !code.isActive);
    setPending(false);
    router.refresh();
  }

  return (
    <tr className="border-t-2 border-forest/15">
      <Td>
        <span className="font-heading font-black tracking-tight text-forest">
          {code.code}
        </span>
      </Td>
      <Td align="right">
        <span className="font-heading text-[15px] font-black text-sage">
          {code.trialMonths}
        </span>
      </Td>
      <Td>
        {code.paddleDiscountId ? (
          <span className="font-mono text-[11px] text-forest/70">
            {code.paddleDiscountId}
          </span>
        ) : (
          "—"
        )}
      </Td>
      <Td align="right">
        {code.usedCount} / {code.maxUses ?? "∞"}
      </Td>
      <Td>{code.expiresAt ? formatTripDate(code.expiresAt) : "Pa afat"}</Td>
      <Td>
        <span
          className={cn(
            "text-[10px] font-bold tracking-[0.08em] uppercase",
            STATUS_TONE[code.status],
          )}
        >
          {STATUS_LABELS[code.status]}
        </span>
      </Td>
      <Td align="right">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={cn(
            "border-2 px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors disabled:opacity-50",
            code.isActive
              ? "border-danger bg-summit text-danger hover:bg-danger hover:text-summit"
              : "border-forest bg-summit text-forest hover:bg-forest hover:text-summit",
          )}
        >
          {pending ? "…" : code.isActive ? "Çaktivizo" : "Aktivizo"}
        </button>
      </Td>
    </tr>
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
