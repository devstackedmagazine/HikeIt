"use client";

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
import { registrationStatusLabels } from "@/lib/i18n/labels";
import {
  emailTripRegistrants,
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
                    <Badge variant="secondary">
                      {registrationStatusLabels[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setStatus(r.id, "confirmed")}
                      >
                        Konfirmo
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setStatus(r.id, "waitlisted")}
                      >
                        Pritje
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setStatus(r.id, "canceled")}
                      >
                        Hiq
                      </Button>
                    </div>
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
