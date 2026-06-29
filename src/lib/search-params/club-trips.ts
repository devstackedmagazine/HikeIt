import { parseAsInteger, parseAsString } from "nuqs/server";

/** Shared nuqs parsers for the club-admin trips management table. */
export const clubTripsParsers = {
  status: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};
