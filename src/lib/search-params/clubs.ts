import { parseAsInteger, parseAsString } from "nuqs/server";

/** Shared nuqs parsers for the clubs listing (search + city tab + page). */
export const clubsParsers = {
  search: parseAsString.withDefault(""),
  city: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};
