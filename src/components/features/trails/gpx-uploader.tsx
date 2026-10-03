"use client";

import { FileUp, Loader2, Mountain, X } from "lucide-react";
import { useRef, useState } from "react";

import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { Button } from "@/components/ui/button";
import {
  GPX_TOO_LARGE_MESSAGE,
  MAX_GPX_BYTES,
  type ParsedGpx,
  parseGpxFile,
} from "@/lib/gpx/parser";
import { trailTypeLabels } from "@/lib/i18n/labels";

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GpxUploader({
  onParsed,
  onCleared,
  tone = "light",
  error: externalError,
}: {
  onParsed: (content: string, parsed: ParsedGpx) => void;
  onCleared?: () => void;
  /** "dark" for the Forest form surface (trail proposal). */
  tone?: "light" | "dark";
  /** An error from outside (e.g. the server rejecting the file). */
  error?: string;
}) {
  const dark = tone === "dark";
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedGpx | null>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);

  async function handleFile(file: File) {
    setError(null);
    // Checked here, before anything is read or sent.
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("Vetëm skedarë .gpx lejohen.");
      return;
    }
    if (file.size > MAX_GPX_BYTES) {
      setError(GPX_TOO_LARGE_MESSAGE);
      return;
    }
    setParsing(true);
    try {
      const content = await file.text();
      const result = await parseGpxFile(file);
      setParsed(result);
      setFile({ name: file.name, size: file.size });
      onParsed(content, result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "GPX i pavlefshëm.");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setParsing(false);
    }
  }

  function clear() {
    setParsed(null);
    setFile(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
    onCleared?.();
  }

  const shownError = error ?? externalError;

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
          aria-describedby={shownError ? "gpx-error" : undefined}
          className={
            dark
              ? "border-summit/40 bg-summit/[0.05] text-summit hover:border-sage hover:bg-summit/[0.08] focus-visible:border-sage flex min-h-36 w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-10 transition-colors outline-none"
              : "text-muted-foreground hover:bg-muted flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 transition-colors"
          }
        >
          {parsing ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <FileUp className="size-6" />
          )}
          <span className={dark ? "text-sm font-semibold" : "text-sm"}>
            {parsing
              ? "Duke lexuar…"
              : "Zgjidh një skedar GPX (.gpx, max 4 MB)"}
          </span>
        </button>
      ) : (
        <div
          className={
            dark
              ? "border-summit/40 text-summit space-y-3 border-2 p-4"
              : "space-y-3 rounded-xl border p-4"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <Mountain
                className={
                  dark
                    ? "text-sage size-4 shrink-0"
                    : "text-primary size-4 shrink-0"
                }
              />
              <span className="truncate">{file?.name}</span>
              {file ? (
                <span
                  className={
                    dark
                      ? "text-summit/70 shrink-0 text-xs"
                      : "text-muted-foreground shrink-0 text-xs"
                  }
                >
                  {formatBytes(file.size)}
                </span>
              ) : null}
            </span>
            {dark ? (
              <button
                type="button"
                onClick={clear}
                className="border-summit/40 text-summit hover:border-sage flex h-9 shrink-0 items-center gap-1 border-2 px-3 text-[10px] font-bold tracking-[0.08em] uppercase"
              >
                <X className="size-3.5" />
                Hiq
              </button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clear}
                aria-label="Hiq"
              >
                <X />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat
              dark={dark}
              label="Distanca"
              value={`${parsed.totalDistanceKm} km`}
            />
            <Stat
              dark={dark}
              label="Ngjitje"
              value={`${parsed.totalElevationGainM} m`}
            />
            <Stat
              dark={dark}
              label="Pika"
              value={String(parsed.points.length)}
            />
            <Stat
              dark={dark}
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

      {shownError ? (
        <p
          id="gpx-error"
          role="alert"
          className={
            dark ? "text-alert text-[11px]" : "text-destructive text-sm"
          }
        >
          {shownError}
        </p>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "bg-summit/[0.06] p-2 text-center"
          : "bg-muted/50 rounded-lg p-2 text-center"
      }
    >
      <p className="font-semibold">{value}</p>
      <p
        className={
          dark ? "text-summit/70 text-xs" : "text-muted-foreground text-xs"
        }
      >
        {label}
      </p>
    </div>
  );
}
