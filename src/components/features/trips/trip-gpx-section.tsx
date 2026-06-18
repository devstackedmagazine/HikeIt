"use client";

import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GpxUploader } from "@/components/features/trails/gpx-uploader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { uploadTripGpx } from "@/server/actions/gpx";

export function TripGpxSection({
  tripId,
  existingGpxUrl,
}: {
  tripId: string;
  existingGpxUrl: string | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!content) return;
    setStatus("loading");
    setError(null);
    const result = await uploadTripGpx(tripId, content);
    if (!result.success) {
      setStatus("idle");
      setError(result.error ?? "Ngarkimi dështoi.");
      return;
    }
    setStatus("done");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skedari GPX</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {existingGpxUrl ? (
          <Button
            variant="outline"
            size="sm"
            render={<a href={existingGpxUrl} download />}
          >
            <Download />
            Shkarko GPX aktual
          </Button>
        ) : null}

        <GpxUploader onParsed={(c) => setContent(c)} />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {status === "done" ? (
          <p className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="size-4" />
            GPX u ngarkua.
          </p>
        ) : null}

        <Button onClick={upload} disabled={!content || status === "loading"}>
          {status === "loading" ? <Loader2 className="animate-spin" /> : null}
          Ngarko GPX
        </Button>
      </CardContent>
    </Card>
  );
}
