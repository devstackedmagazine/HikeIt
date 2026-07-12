import { TrailGridSkeleton } from "@/components/features/trails/trail-card-skeleton";

export default function Loading() {
  return (
    <div className="bg-abyss">
      <div className="flex flex-col justify-between gap-4 px-6 pt-6 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="h-2.5 w-20 animate-pulse bg-summit/10" />
          <div className="h-5 w-56 animate-pulse bg-summit/10" />
          <div className="h-3 w-72 animate-pulse bg-summit/[0.06]" />
        </div>
        <div className="h-[38px] w-full animate-pulse bg-summit/[0.05] sm:w-[260px]" />
      </div>

      <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row">
        <div className="hidden h-96 w-55 shrink-0 animate-pulse bg-summit/4 lg:block" />
        <TrailGridSkeleton count={6} />
      </div>
    </div>
  );
}
