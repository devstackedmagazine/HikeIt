import { parseAsArrayOf, parseAsInteger, parseAsString } from "nuqs/server";

/**
 * Shared nuqs parsers for the trails listing filters. Imported by both the
 * Server Component page (via `createSearchParamsCache`) and the client filter
 * sidebar (via `useQueryStates`) so the URL contract stays in sync. This file
 * intentionally exports only parsers — no server-only cache — so it is safe to
 * import from client components.
 */
export const trailsParsers = {
  search: parseAsString.withDefault(""),
  difficulty: parseAsArrayOf(parseAsString).withDefault([]),
  region: parseAsString.withDefault(""),
  season: parseAsArrayOf(parseAsString).withDefault([]),
  features: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(1),
};
