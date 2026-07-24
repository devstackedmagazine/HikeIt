import { Mountain } from "lucide-react";
import Link from "next/link";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-summit/[0.06] py-2 last:border-b-0">
      <span className="text-[10px] font-medium text-summit/35 uppercase">
        {label}
      </span>
      <span className="text-[11px] font-bold text-summit/70">{value}</span>
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
    <div className="min-w-0 border border-summit/[0.08] bg-summit/[0.02] p-4">
      <p className="mb-3 text-[9px] font-semibold tracking-[0.12em] text-summit/30 uppercase">
        Organizatori
      </p>

      <div className="flex items-center gap-2.5">
        {/* Square (not circular) club icon — unique to this card. */}
        <span className="flex size-9 shrink-0 items-center justify-center border border-moss/20 bg-moss/[0.12] text-moss">
          <Mountain className="size-[18px]" />
        </span>
        <span className="font-heading text-[14px] leading-[1.1] font-extrabold tracking-[-0.01em] text-summit uppercase">
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
        className="mt-3 block border border-summit/12 py-2 text-center text-[10px] font-semibold tracking-[0.08em] text-summit/45 uppercase transition-colors hover:border-moss/30 hover:text-moss"
      >
        Shiko Klubin →
      </Link>
    </div>
  );
}
