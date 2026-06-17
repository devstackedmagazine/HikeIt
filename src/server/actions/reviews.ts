"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { reviews, trails } from "@/lib/db/schema";
import {
  type SubmitReviewInput,
  submitReviewSchema,
} from "@/lib/validations/reviews";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Create or update the current user's review of a trail. A user can review a
 * trail only once — the unique (trail, user) constraint turns re-submits into
 * an update via upsert.
 */
export async function submitTrailReview(
  input: SubmitReviewInput,
): Promise<ActionResult> {
  const session = await getOptionalSession();
  if (!session) {
    return { success: false, error: "Duhet të jeni i kyçur." };
  }

  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Të dhëna të pavlefshme." };
  }
  const { trailId, rating, comment, conditionReport, hikedAt } = parsed.data;

  const trail = await db.query.trails.findFirst({
    where: eq(trails.id, trailId),
    columns: { slug: true },
  });
  if (!trail) {
    return { success: false, error: "Shtegu nuk u gjet." };
  }

  await db
    .insert(reviews)
    .values({
      trailId,
      userId: session.user.id,
      rating,
      comment: comment || null,
      conditionReport: conditionReport ?? null,
      hikedAt: hikedAt ?? null,
    })
    .onConflictDoUpdate({
      target: [reviews.trailId, reviews.userId],
      set: {
        rating,
        comment: comment || null,
        conditionReport: conditionReport ?? null,
        hikedAt: hikedAt ?? null,
      },
    });

  revalidatePath(`/trails/${trail.slug}`);
  return { success: true };
}
