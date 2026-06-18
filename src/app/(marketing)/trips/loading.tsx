import { CardGridSkeleton } from "@/components/shared/card-grid-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-72 animate-pulse rounded bg-muted" />
        <div className="h-5 w-80 animate-pulse rounded bg-muted" />
      </div>
      <CardGridSkeleton />
    </div>
  );
}
