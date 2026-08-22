"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getOptionalSession } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { trailFavorites, tripFavorites } from "@/lib/db/schema";
import {
  enforceRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";
import { captureError } from "@/lib/sentry";

export interface FavoriteResult {
  success: boolean;
  saved?: boolean;
  error?: string;
}

export async function toggleTrailFavorite(
  trailId: string,
): Promise<FavoriteResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const ip = await getClientIp();
  const rateLimitError = await enforceRateLimit("ratelimit.favorite.toggle", {
    userId: session.user.id,
    ip,
  });
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    const existing = await db.query.trailFavorites.findFirst({
      where: and(
        eq(trailFavorites.userId, session.user.id),
        eq(trailFavorites.trailId, trailId),
      ),
    });

    if (existing) {
      await db
        .delete(trailFavorites)
        .where(eq(trailFavorites.id, existing.id));
      revalidatePath("/dashboard/trails");
      return { success: true, saved: false };
    }

    await db.insert(trailFavorites).values({
      userId: session.user.id,
      trailId,
    });
    revalidatePath("/dashboard/trails");
    return { success: true, saved: true };
  } catch (error) {
    captureError(error, {
      action: "toggleTrailFavorite",
      userId: session.user.id,
    });
    return { success: false, error: "Diçka shkoi keq." };
  }
}

export async function toggleTripFavorite(
  tripId: string,
): Promise<FavoriteResult> {
  const session = await getOptionalSession();
  if (!session) return { success: false, error: "Duhet të jeni i kyçur." };

  const ip = await getClientIp();
  const rateLimitError = await enforceRateLimit("ratelimit.favorite.toggle", {
    userId: session.user.id,
    ip,
  });
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    const existing = await db.query.tripFavorites.findFirst({
      where: and(
        eq(tripFavorites.userId, session.user.id),
        eq(tripFavorites.tripId, tripId),
      ),
    });

    if (existing) {
      await db
        .delete(tripFavorites)
        .where(eq(tripFavorites.id, existing.id));
      revalidatePath("/dashboard/my-trips");
      return { success: true, saved: false };
    }

    await db.insert(tripFavorites).values({
      userId: session.user.id,
      tripId,
    });
    revalidatePath("/dashboard/my-trips");
    return { success: true, saved: true };
  } catch (error) {
    captureError(error, {
      action: "toggleTripFavorite",
      userId: session.user.id,
    });
    return { success: false, error: "Diçka shkoi keq." };
  }
}
