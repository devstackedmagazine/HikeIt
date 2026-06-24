export function TrailCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden border border-summit/10 bg-summit/[0.03]">
      <div className="h-[160px] animate-pulse bg-summit/[0.06]" />
      <div className="flex flex-1 flex-col px-3.5 py-3">
        <div className="mb-2 h-3.5 w-3/4 animate-pulse bg-summit/10" />
        <div className="mb-3 h-2.5 w-1/2 animate-pulse bg-summit/[0.06]" />
        <div className="mb-3 flex gap-3">
          <div className="h-6 w-10 animate-pulse bg-summit/[0.06]" />
          <div className="h-6 w-10 animate-pulse bg-summit/[0.06]" />
          <div className="h-6 w-10 animate-pulse bg-summit/[0.06]" />
        </div>
        <div className="mb-3 flex gap-[5px]">
          <div className="h-4 w-12 animate-pulse bg-summit/[0.06]" />
          <div className="h-4 w-12 animate-pulse bg-summit/[0.06]" />
        </div>
        <div className="h-9 w-full animate-pulse bg-moss/10" />
      </div>
    </div>
  );
}

export function TrailGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrailCardSkeleton key={i} />
      ))}
    </div>
  );
}
