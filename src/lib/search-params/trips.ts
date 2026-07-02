import { parseAsInteger, parseAsString } from "nuqs/server";

/** Shared nuqs parsers for the public trips discovery filters. */
export const tripsParsers = {
  difficulty: parseAsString.withDefault(""),
  region: parseAsString.withDefault(""),
  dateRange: parseAsString.withDefault(""),
  club: parseAsString.withDefault(""),
  free: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};
