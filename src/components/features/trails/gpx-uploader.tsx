"use client";

import { FileUp, Loader2, Mountain, X } from "lucide-react";
import { useRef, useState } from "react";

import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { Button } from "@/components/ui/button";
import { type ParsedGpx, parseGpxFile } from "@/lib/gpx/parser";
import { trailTypeLabels } from "@/lib/i18n/labels";

const MAX_BYTES = 5 * 1024 * 1024;

export function GpxUploader({
  onParsed,
}: {
  onParsed: (content: string, parsed: ParsedGpx) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedGpx | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("Vetëm skedarë .gpx lejohen.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Skedari tejkalon 5MB.");
      return;
    }
    setParsing(true);
    try {
      const content = await file.text();
      const result = await parseGpxFile(file);
      setParsed(result);
      setFileName(file.name);
      onParsed(content, result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "GPX i pavlefshëm.");
    } finally {
      setParsing(false);
    }
  }

  function clear() {
    setParsed(null);
    setFileName(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept=".gpx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {!parsed ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={parsing}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-muted-foreground transition-colors hover:bg-muted"
        >
          {parsing ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <FileUp className="size-6" />
          )}
          <span className="text-sm">
            {parsing ? "Duke lexuar…" : "Zgjidh një skedar GPX (.gpx, max 5MB)"}
          </span>
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Mountain className="size-4 text-primary" />
              {fileName}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={clear} aria-label="Hiq">
              <X />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Distanca" value={`${parsed.totalDistanceKm} km`} />
            <Stat label="Ngjitje" value={`${parsed.totalElevationGainM} m`} />
            <Stat label="Pika" value={String(parsed.points.length)} />
            <Stat
              label="Lloji"
              value={trailTypeLabels[parsed.trackType] ?? parsed.trackType}
            />
          </div>

          <TrailMap
            trailName={parsed.name}
            startLat={parsed.startLat}
            startLng={parsed.startLng}
            endLat={parsed.endLat}
            endLng={parsed.endLng}
            route={parsed.points.map((p) => [p.lat, p.lng] as [number, number])}
          />
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <p className="font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
