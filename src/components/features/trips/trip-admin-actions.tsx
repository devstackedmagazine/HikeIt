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

  async function onPublish() {
    setPublishing(true);
    await publishTrip(clubSlug, tripId);
    setPublishing(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" ? (
        <Button size="sm" onClick={onPublish} disabled={publishing}>
          {publishing ? <Loader2 className="animate-spin" /> : <Send />}
          Publiko
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

  async function onCancel() {
    setLoading(true);
    await cancelTrip(tripId, reason);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <XCircle />
            Anulo Udhëtimin
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anulo udhëtimin</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Shkruaj arsyen e anulimit — do t&apos;u dërgohet të gjithë
          regjistruarve.
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
          Konfirmo anulimin
        </Button>
      </DialogContent>
    </Dialog>
  );
}
