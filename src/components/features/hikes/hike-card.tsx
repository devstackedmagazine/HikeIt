"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  formatDuration,
  formatHikeDate,
  formatKm,
} from "@/components/features/hikes/format";
import { TrailMap } from "@/components/features/trails/trail-map-loader";
import { deleteHike } from "@/server/actions/hikes";
import type { HikeListItem } from "@/server/queries/hikes";

export function HikeCard({ hike }: { hike: HikeListItem }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = hike.track[0];
  const end = hike.track[hike.track.length - 1];

  async function remove() {
    setBusy(true);
    setError(null);
    const result = await deleteHike(hike.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error ?? "Fshirja dështoi.");
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  return (
    <article className="border-forest/12 bg-summit border">
      {start && end && hike.track.length > 1 ? (
        <TrailMap
          trailName={hike.name}
          startLat={start[0]}
          startLng={start[1]}
          endLat={end[0]}
          endLng={end[1]}
          route={hike.track}
          height="200px"
        />
      ) : (
        <div className="bg-forest/[0.04] text-forest/50 flex h-[200px] items-center justify-center px-4 text-center text-[10px] font-semibold tracking-[0.08em] uppercase">
          Gjurma është shumë e shkurtër për t&apos;u shfaqur në hartë
        </div>
      )}

      <div className="p-3.5">
        <p className="text-forest/55 text-[9px] font-semibold tracking-[0.1em] uppercase">
          {formatHikeDate(hike.hikedAt)}
        </p>
        <h3 className="font-heading text-forest mt-1 text-[13px] leading-[1.2] font-extrabold tracking-[-0.01em] uppercase">
          {hike.name}
        </h3>
        {hike.tripTitle ? (
          <span className="border-moss/30 bg-moss/15 text-pine mt-1.5 inline-block border px-2 py-0.5 text-[8px] font-bold tracking-[0.08em] uppercase">
            Udhëtim: {hike.tripTitle}
          </span>
        ) : null}

        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          <Figure label="Distanca" value={formatKm(hike.distanceKm)} />
          <Figure label="Ngjitja" value={`${hike.elevationGainM} M`} />
          <Figure label="Kohëzgjatja" value={formatDuration(hike.durationMin)} />
        </div>

        <div className="border-forest/10 mt-3 flex items-center gap-2 border-t pt-3">
          {confirming ? (
            <>
              <span className="text-forest/70 mr-auto text-[10px] font-semibold">
                Fshi ecjen dhe gjurmën përgjithmonë?
              </span>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="text-forest/60 hover:text-forest px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase"
              >
                Jo
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="bg-danger text-summit flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold tracking-[0.08em] uppercase"
              >
                {busy ? <Loader2 className="size-3 animate-spin" /> : null}
                Po, fshije
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Fshi ecjen"
              className="text-forest/40 hover:text-danger ml-auto"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
        {error ? (
          <p className="text-danger mt-2 text-[10px] font-medium">{error}</p>
        ) : null}
      </div>
    </article>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-forest/60 text-[8px] font-semibold tracking-[0.1em] uppercase">
        {label}
      </p>
      <p className="font-heading text-forest text-xs font-bold">{value}</p>
    </div>
  );
}
