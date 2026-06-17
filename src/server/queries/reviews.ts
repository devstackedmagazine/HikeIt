import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Review } from "@/lib/db/schema";
import { reviews, users } from "@/lib/db/schema";

export interface TrailReview extends Review {
  userName: string | null;
  userAvatarUrl: string | null;
}

export interface TrailReviewsResult {
  reviews: TrailReview[];
  average: number;
  count: number;
}

/**
 * Reviews for a trail (newest first, capped) plus the aggregate rating. A
 * single joined query — no N+1.
 */
export async function getTrailReviews(
  trailId: string,
  limit = 5,
): Promise<TrailReviewsResult> {
  const rows = await db
    .select({
      review: reviews,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.trailId, trailId))
    .orderBy(desc(reviews.createdAt));

  const count = rows.length;
  const average =
    count === 0
      ? 0
      : rows.reduce((sum, r) => sum + r.review.rating, 0) / count;

  const mapped: TrailReview[] = rows.slice(0, limit).map((r) => ({
    ...r.review,
    userName: r.userName,
    userAvatarUrl: r.userAvatarUrl,
  }));

  return { reviews: mapped, average, count };
}
