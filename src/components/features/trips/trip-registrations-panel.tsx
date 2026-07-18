"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Download, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  emailTripRegistrants,
  removeRegistration,
  updateRegistrationStatus,
} from "@/server/actions/trip-registrations";
import type { RegistrationWithUser } from "@/server/queries/trips";

export function TripRegistrationsPanel({
  tripId,
  registrations,
}: {
  tripId: string;
  registrations: RegistrationWithUser[];
}) {
  const router = useRouter();

  async function setStatus(
    id: string,
    status: "confirmed" | "waitlisted" | "canceled",
  ) {
    await updateRegistrationStatus(id, status);
    router.refresh();
  }

  function exportCsv() {
    const header = "Name,Email,Status,Payment,Registered\n";
    const rows = registrations
      .map((r) =>
        [
          r.userName ?? "",
          r.userEmail,
          r.status,
          r.paymentStatus,
          r.registeredAt.toISOString(),
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {registrations.length} regjistrime
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download />
            CSV
          </Button>
          <EmailAllDialog tripId={tripId} />
        </div>
      </div>

      {registrations.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Asnjë regjistrim ende.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emri</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Statusi</TableHead>
                <TableHead>Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.userName ?? "Anëtar"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.userEmail}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <RegistrationActions
                      registration={r}
                      onSetStatus={setStatus}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/** Status badge shown in the status column. */
function StatusBadge({ status }: { status: RegistrationWithUser["status"] }) {
  return <Badge variant="secondary">{status.toUpperCase()}</Badge>;
}

/**
 * Status-appropriate action controls for a single registration.
 * - confirmed + paid → remove with automatic refund (Danger)
 * - confirmed + free → remove (Danger)
 * - pending payment → "NË PRITJE PAGESE" badge, no actions
 * - waitlisted → KONFIRMO (Moss) + HIQ (Danger)
 * - canceled / refunded → "I HEQUR" badge, no actions
 */
function RegistrationActions({
  registration: r,
  onSetStatus,
}: {
  registration: RegistrationWithUser;
  onSetStatus: (
    id: string,
    status: "confirmed" | "waitlisted" | "canceled",
  ) => void | Promise<void>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const amountLabel = r.amountPaidEur
    ? `€${Number(r.amountPaidEur).toFixed(2)}`
    : "€0";

  async function remove() {
    setError(null);
    const result = await removeRegistration(r.id);
    if (!result.success) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    router.refresh();
  }

  // Terminal states: nothing to do.
  if (r.status === "canceled" || r.paymentStatus === "refunded") {
    return (
      <Badge className="border-2 border-summit/20 bg-summit/10 text-summit/50">
        I HEQUR
      </Badge>
    );
  }

  // Pending payment: block any action until it resolves.
  if (r.status === "pending" && r.paymentStatus === "pending") {
    return (
      <span
        title="Prisni që pagesa të konfirmohet ose të dështojë."
        className="inline-flex cursor-help items-center border-2 border-alert/50 bg-alert/15 px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-alert uppercase"
      >
        Në pritje pagese
      </span>
    );
  }

  if (r.status === "waitlisted") {
    return (
      <div className="space-y-1">
        <div className="flex gap-1">
          <Button
            size="xs"
            className="border-2 border-moss bg-moss/20 font-bold text-moss uppercase hover:bg-moss/30"
            onClick={() => onSetStatus(r.id, "confirmed")}
          >
            Konfirmo
          </Button>
          <ConfirmRemoveDialog
            triggerLabel="Hiq"
            title="Hiq nga udhëtimi"
            description="A jeni i sigurt? Ky person do të hiqet nga udhëtimi."
            onConfirm={remove}
          />
        </div>
        {error ? <ActionError message={error} /> : null}
      </div>
    );
  }

  // confirmed (or attended/no_show) — remove path, with refund if paid.
  const isPaid = r.paymentStatus === "paid";
  return (
    <div className="space-y-1">
      <ConfirmRemoveDialog
        triggerLabel={isPaid ? "Hiq me rimbursim" : "Hiq"}
        title={isPaid ? "Hiq me rimbursim" : "Hiq nga udhëtimi"}
        description={
          isPaid
            ? `A jeni i sigurt? Pagesa e ${amountLabel} do t'i kthehet hikerit automatikisht.`
            : "A jeni i sigurt? Ky person do të hiqet nga udhëtimi."
        }
        onConfirm={remove}
      />
      {error ? <ActionError message={error} /> : null}
    </div>
  );
}

function ActionError({ message }: { message: string }) {
  return (
    <p className="text-[11px] text-danger" role="alert">
      {message}
    </p>
  );
}

/**
 * Alpine Brutalism confirmation dialog: Abyss background, Summit text, 2px
 * Forest borders, zero border radius. Danger button confirms, Forest button
 * cancels. Built directly on the base-ui alert-dialog so the styled wrapper's
 * rounded corners don't leak in.
 */
function ConfirmRemoveDialog({
  triggerLabel,
  title,
  description,
  onConfirm,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    setOpen(false);
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <Button
            size="xs"
            className="border-2 border-danger bg-danger/15 font-bold text-danger uppercase hover:bg-danger hover:text-summit"
          />
        }
      >
        {triggerLabel}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-abyss/70 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 border-2 border-forest bg-abyss p-6 text-summit outline-none sm:max-w-md">
          <AlertDialog.Title className="font-heading text-[16px] font-extrabold tracking-[0.04em] text-summit uppercase">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-[13px] leading-relaxed text-summit/70">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Close
              render={
                <Button
                  disabled={loading}
                  className="border-2 border-forest bg-transparent font-bold tracking-[0.04em] text-summit uppercase hover:bg-forest disabled:opacity-50"
                />
              }
            >
              Anulo
            </AlertDialog.Close>
            <Button
              onClick={confirm}
              disabled={loading}
              className="border-2 border-danger bg-danger font-bold tracking-[0.04em] text-summit uppercase hover:bg-red-900 hover:border-red-900 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              Hiq
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function EmailAllDialog({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    const result = await emailTripRegistrants(tripId, subject, message);
    setLoading(false);
    if (result.success) {
      setDone(`U dërgua te ${result.sentCount ?? 0} persona.`);
    } else {
      setDone(result.error ?? "Gabim.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Mail />
            Dërgo Email të Gjithëve
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email te të gjithë regjistruarit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-subject">Subjekti</Label>
            <Input
              id="email-subject"
              className="h-9"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-message">Mesazhi</Label>
            <Textarea
              id="email-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {done ? <p className="text-sm text-muted-foreground">{done}</p> : null}
          <Button
            onClick={send}
            disabled={loading || !subject || !message}
            className="w-full"
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            Dërgo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
