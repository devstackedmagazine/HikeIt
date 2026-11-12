"use client";

import { Loader2, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cancelTrip } from "@/server/actions/trip-registrations";
import { publishTrip } from "@/server/actions/trips";

export function TripAdminActions({
  clubSlug,
  tripId,
  status,
}: {
  clubSlug: string;
  tripId: string;
  status: string;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPublish() {
    setPublishing(true);
    setError(null);
    const result = await publishTrip(clubSlug, tripId);
    setPublishing(false);
    if (!result.success) {
      setError(result.error ?? "Udhëtimi nuk u publikua. Provoni sërish.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {error ? (
        <p className="text-destructive w-full text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {status === "draft" ? (
        <Button size="sm" onClick={onPublish} disabled={publishing}>
          {publishing ? <Loader2 className="animate-spin" /> : <Send />}
          Publikoni
        </Button>
      ) : null}
      {status !== "canceled" ? <CancelDialog tripId={tripId} /> : null}
    </div>
  );
}

function CancelDialog({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCancel() {
    setLoading(true);
    setError(null);
    const result = await cancelTrip(tripId, reason);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Udhëtimi nuk u anulua. Provoni sërish.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <XCircle />
            Anuloni Udhëtimin
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anuloni udhëtimin</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Shkruani arsyen e anulimit — do t&apos;u dërgohet me email të
          gjithë të regjistruarve.
        </p>
        <Textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          variant="destructive"
          onClick={onCancel}
          disabled={loading || !reason}
        >
          {loading ? <Loader2 className="animate-spin" /> : null}
          Konfirmoni anulimin
        </Button>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
