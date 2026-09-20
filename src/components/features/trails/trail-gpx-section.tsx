"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GpxUploader } from "@/components/features/trails/gpx-uploader";
import { Button } from "@/components/ui/button";
import { uploadTrailGpx } from "@/server/actions/gpx";

export function TrailGpxSection({ trailId }: { trailId: string }) {
  const router = useRouter();
  const [content, setContent] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!content) return;
    setStatus("loading");
    setError(null);
    const result = await uploadTrailGpx(trailId, content);
    if (!result.success) {
      setStatus("idle");
      setError(result.error ?? "Ngarkimi dështoi.");
      return;
    }
    setStatus("done");
    router.refresh();
  }

  return (
    <div className="border border-summit/10 p-4">
      <p className="mb-3 text-[10px] font-bold tracking-[0.12em] text-summit/40 uppercase">
        Ngarko Skedar GPX
      </p>

      <GpxUploader onParsed={(c) => setContent(c)} />

      {error ? (
        <p className="mt-2 text-[11px] font-medium text-danger">{error}</p>
      ) : null}
      {status === "done" ? (
        <p className="mt-2 flex items-center gap-2 text-[11px] font-medium text-moss">
          <CheckCircle2 className="size-3.5" />
          GPX u ngarkua me sukses.
        </p>
      ) : null}

      <Button
        onClick={upload}
        disabled={!content || status === "loading"}
        className="mt-3 border-2 border-moss bg-moss text-abyss hover:bg-pine"
        size="sm"
      >
        {status === "loading" ? <Loader2 className="animate-spin" /> : null}
        Ngarko GPX
      </Button>
    </div>
  );
}
