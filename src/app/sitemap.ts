import { eq, isNull } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { organizations, trails, trips } from "@/lib/db/schema";

const BASE_URL = "https://hikeit.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes = [
    "",
    "/trails",
    "/clubs",
    "/trips",
    "/pricing",
    "/about",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const [trailRows, clubRows, tripRows] = await Promise.all([
    db
      .select({ slug: trails.slug })
      .from(trails)
      .where(eq(trails.verified, true)),
    db
      .select({ slug: organizations.slug })
      .from(organizations)
      .where(isNull(organizations.deletedAt)),
    db
      .select({ slug: trips.slug })
      .from(trips)
      .where(eq(trips.status, "open")),
  ]);

  const dynamicRoutes = [
    ...trailRows.map((t) => `/trails/${t.slug}`),
    ...clubRows.map((c) => `/clubs/${c.slug}`),
    ...tripRows.map((t) => `/trips/${t.slug}`),
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
