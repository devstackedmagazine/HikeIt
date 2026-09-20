import { Mountain } from "lucide-react";
import Link from "next/link";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-summit/[0.06] flex items-center justify-between border-b py-2 last:border-b-0">
      <span className="text-summit/35 text-[10px] font-medium uppercase">
        {label}
      </span>
      <span className="text-summit/70 text-[11px] font-bold">{value}</span>
    </div>
  );
}

export function TripOrganizerCard({
  clubName,
  clubSlug,
  memberCount,
  tripCount,
}: {
  clubName: string;
  clubSlug: string;
  memberCount: number;
  tripCount: number;
}) {
  return (
    <div className="border-summit/[0.08] bg-summit/[0.02] min-w-0 border p-4">
      <p className="text-summit/30 mb-3 text-[9px] font-semibold tracking-[0.12em] uppercase">
        Organizatori
      </p>

      <div className="flex items-center gap-2.5">
        {/* Square (not circular) club icon — unique to this card. */}
        <span className="border-moss/20 bg-moss/[0.12] text-moss flex size-9 shrink-0 items-center justify-center border">
          <Mountain className="size-[18px]" />
        </span>
        <span className="font-heading text-summit text-[14px] leading-[1.1] font-extrabold tracking-[-0.01em] uppercase">
          {clubName}
        </span>
      </div>

      <div className="mt-3">
        <StatRow label="Anëtarë" value={memberCount.toLocaleString("en-US")} />
        <StatRow label="Udhëtime" value={String(tripCount)} />
        <StatRow label="Rating" value="—" />
      </div>

      <Link
        href={`/clubs/${clubSlug}`}
        className="border-summit/40 text-summit/45 hover:border-moss hover:text-moss mt-3 block border py-2 text-center text-[10px] font-semibold tracking-[0.08em] uppercase transition-colors"
      >
        Shiko Klubin →
      </Link>
    </div>
  );
}
