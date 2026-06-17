import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function TrailCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden pt-0">
      <div className="h-40 animate-pulse bg-muted" />
      <CardContent className="flex-1 space-y-3">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="flex gap-3">
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
      </CardFooter>
    </Card>
  );
}

export function TrailGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrailCardSkeleton key={i} />
      ))}
    </div>
  );
}
