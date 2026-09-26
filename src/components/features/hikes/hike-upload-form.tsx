"use client";

import { FileUp, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  formatDuration,
  formatHikeDate,
  formatKm,
} from "@/components/features/hikes/format";
import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { analyzeHike,type HikeAnalysis } from "@/lib/gpx/hike";
import { parseGpxString } from "@/lib/gpx/parser";
import { createHike } from "@/server/actions/hikes";
import type { LinkableTrip } from "@/server/queries/hikes";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload → confirm → save. The file is parsed and checked in the browser with
 * the same rules the server applies, so the user sees rejections and the
 * exact stats before anything is sent. The server re-derives everything.
 */
export function HikeUploadForm({
  linkableTrips,
}: {
  linkableTrips: LinkableTrip[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HikeAnalysis | null>(null);
  const [name, setName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [busy, setBusy] = useState<"parsing" | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setContent(null);
    setAnalysis(null);
    setName("");
    setRegistrationId("");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(file: File) {
    reset();
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("Vetëm skedarë .gpx lejohen.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Skedari tejkalon 5MB.");
      return;
    }
    setBusy("parsing");
    try {
      const text = await file.text();
      const result = analyzeHike(await parseGpxString(text));
      setContent(text);
      setAnalysis(result);
      setName(result.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "GPX i pavlefshëm.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!content) return;
    setBusy("saving");
    setError(null);
    const result = await createHike({
      gpxContent: content,
      name,
      tripRegistrationId: registrationId || null,
    });
    setBusy(null);
    if (!result.success) {
      setError(result.error ?? "Ruajtja dështoi.");
      return;
    }
    reset();
    router.replace("/dashboard/hikes");
  }

  const track = analysis?.track ?? [];
  const start = track[0];
  const end = track[track.length - 1];

  return (
    <div className="border-forest/12 bg-summit border p-4">
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

      {!analysis ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy === "parsing"}
          className="border-forest/25 text-forest/70 hover:bg-forest/[0.04] flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed py-10 transition-colors"
        >
          {busy === "parsing" ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <FileUp className="size-6" />
          )}
          <span className="text-[11px] font-bold tracking-[0.08em] uppercase">
            {busy === "parsing" ? "Duke lexuar…" : "Zgjidh skedarin GPX të ecjes"}
          </span>
          <span className="text-forest/50 text-[10px]">
            Gjurma e regjistruar nga ora ose aplikacioni GPS · .gpx · max 5MB
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-forest text-[11px] font-bold tracking-[0.08em] uppercase">
              Konfirmo ecjen
            </p>
            <button
              type="button"
              onClick={reset}
              aria-label="Anulo"
              className="text-forest/50 hover:text-forest"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Figure label="Distanca" value={formatKm(analysis.distanceKm)} />
            <Figure label="Ngjitja" value={`${analysis.elevationGainM} M`} />
            <Figure label="Kohëzgjatja" value={formatDuration(analysis.durationMin)} />
            <Figure label="Data" value={formatHikeDate(analysis.hikedAt)} />
          </div>

          {analysis.excludedKm > 0 ? (
            <p className="border-alert/30 bg-alert/10 text-forest/80 border px-3 py-2 text-[10px] leading-[1.5]">
              {formatKm(analysis.excludedKm)} u përjashtuan nga distanca dhe
              ngjitja, sepse u përshkuan me mbi 25 km/h — p.sh. teleferik,
              autobus ose makinë. Kohëzgjatja mbetet koha e plotë.
            </p>
          ) : null}

          {start && end && track.length > 1 ? (
            <TrailMap
              trailName={name}
              startLat={start[0]}
              startLng={start[1]}
              endLat={end[0]}
              endLng={end[1]}
              route={track}
              height="260px"
            />
          ) : null}
          <p className="text-forest/55 text-[10px] leading-[1.5]">
            Për privatësi, rreth 200 m në fillim dhe në fund të gjurmës nuk
            shfaqen në hartë. Ecja është private — vetëm ti e sheh. Skedari
            GPX nuk ruhet: ruajmë vetëm statistikat dhe vijën në hartë.
          </p>

          <label className="block">
            <span className="text-forest/70 mb-1 block text-[9px] font-semibold tracking-[0.12em] uppercase">
              Emri i ecjes
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="border-forest/20 text-forest focus:border-moss w-full border bg-transparent px-3 py-2 text-sm outline-none"
            />
          </label>

          {linkableTrips.length > 0 ? (
            <label className="block">
              <span className="text-forest/70 mb-1 block text-[9px] font-semibold tracking-[0.12em] uppercase">
                Ishte pjesë e një udhëtimi me klub? (opsionale)
              </span>
              <select
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                className="border-forest/20 text-forest focus:border-moss w-full border bg-transparent px-3 py-2 text-sm outline-none"
              >
                <option value="">Jo — ecje personale</option>
                {linkableTrips.map((t) => (
                  <option key={t.registrationId} value={t.registrationId}>
                    {t.title} · {formatHikeDate(t.startDatetime)}
                  </option>
                ))}
              </select>
              <span className="text-forest/50 mt-1 block text-[10px]">
                Nëse e lidh, distanca e kësaj gjurme zëvendëson distancën e
                shtegut të udhëtimit — nuk numërohet dy herë.
              </span>
            </label>
          ) : null}

          <button
            type="button"
            onClick={save}
            disabled={busy === "saving" || !name.trim()}
            className="border-moss bg-moss text-abyss hover:bg-pine hover:text-summit flex w-full items-center justify-center gap-2 border-2 py-2.5 text-[10px] font-bold tracking-[0.1em] uppercase transition-colors disabled:opacity-50 sm:w-auto sm:px-6"
          >
            {busy === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Ruaj ecjen
          </button>
        </div>
      )}

      {error ? (
        <p className="text-danger mt-3 text-[11px] leading-[1.5] font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-forest/10 bg-forest/[0.03] border p-2.5">
      <p className="text-forest/60 text-[8px] font-semibold tracking-[0.12em] uppercase">
        {label}
      </p>
      <p className="font-heading text-forest mt-1 text-sm font-extrabold">
        {value}
      </p>
    </div>
  );
}
