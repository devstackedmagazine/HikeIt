import { Star } from "lucide-react";
import Link from "next/link";

import { ReviewForm } from "@/components/features/trails/review-form";
import { StarRating } from "@/components/features/trails/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { conditionLabels } from "@/lib/validations/reviews";
import type { TrailReview } from "@/server/queries/reviews";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ReviewsSection({
  trailId,
  reviews,
  average,
  count,
  isLoggedIn,
}: {
  trailId: string;
  reviews: TrailReview[];
  average: number;
  count: number;
  isLoggedIn: boolean;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vlerësimet</h2>
          {count > 0 ? (
            <div className="mt-1 flex items-center gap-2">
              <StarRating value={average} />
              <span className="text-muted-foreground text-sm">
                {average.toFixed(1)} · {count} vlerësime
              </span>
            </div>
          ) : null}
        </div>
        {!isLoggedIn ? (
          <Button render={<Link href="/login?redirect=/trails" />}>
            <Star />
            Shto vlerësim
          </Button>
        ) : null}
      </div>

      {isLoggedIn ? <ReviewForm trailId={trailId} /> : null}

      {count === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center">
          Bëhu i pari që vlerëson këtë shteg.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={review.userName}
                  src={review.userAvatarUrl}
                  initials={initials(review.userName)}
                  px={72}
                  className="bg-primary/10 text-primary size-9 text-sm font-semibold"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {review.userName ?? "Anëtar"}
                  </p>
                  <StarRating value={review.rating} />
                </div>
                {review.conditionReport ? (
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    {conditionLabels[review.conditionReport] ??
                      review.conditionReport}
                  </span>
                ) : null}
              </div>
              {review.comment ? (
                <p className="text-muted-foreground mt-3 text-sm">
                  {review.comment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
