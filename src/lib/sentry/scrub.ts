/**
 * Drizzle's query errors read "Failed query: <sql>\nparams: <bound values>".
 * The bound values are whatever the query was writing — a phone number, an
 * emergency contact, an email — so they must not leave the server. The SQL
 * text itself has only placeholders and is kept: it's what makes the error
 * debuggable.
 */
export function scrubQueryParams(text: string): string {
  return text.replace(/(\bparams:)[\s\S]*$/, "$1 [removed]");
}
