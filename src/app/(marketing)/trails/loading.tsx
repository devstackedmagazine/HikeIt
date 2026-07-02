import { TrailGridSkeleton } from "@/components/features/trails/trail-card-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 space-y-2">
        <div className="h-9 w-64 animate-pulse rounded bg-muted" />
        <div className="h-5 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-xl bg-muted lg:block" />
        <TrailGridSkeleton count={6} />
      </div>
    </div>
  );
}
