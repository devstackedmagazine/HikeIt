/**
 * The one place that decides what may leave the server in a log line or a
 * Sentry event. `captureError` / `captureMessage` run everything through it,
 * the server's `console.error` / `console.warn` do in production, and the
 * Sentry `beforeSend` hooks apply it once more as a safety net.
 *
 * Pure (no imports), so `scripts/check-log-sanitising.ts` can run it.
 */

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

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// International (+383…, 00383…) or local (044 123 456) numbers. The
// boundaries keep ids, dates and coordinates intact. No lookbehind: older
// Safari can't parse one, should this file ever reach a browser bundle.
const PHONE =
  /(^|[^\w-])(?:(?:\+|00)\d[\d\s()./-]{6,16}\d|0\d{2}[\s/-]?\d{3}[\s-]?\d{3,4})(?![\w-])/g;

/** Free text: bound query values, email addresses and phone numbers removed. */
export function sanitizeText(text: string): string {
  return scrubQueryParams(text)
    .replace(EMAIL, "[email]")
    .replace(PHONE, "$1[phone]");
}

// Keys whose value is personal whatever it looks like: a name can't be
// recognised in free text, so it is dropped by where it sits.
const PERSONAL_KEY =
  /^(name|to|params|.*(e-?mail|phone|emergency|password|token|secret).*|.*(user|full|first|last|contact|hiker|member|by)_?name)$/i;

const MAX_DEPTH = 5;

/**
 * Anything on its way to a log or to Sentry. Strings are cleaned as text;
 * plain objects lose the values of personal keys; an Error comes back as a
 * copy with a clean message, its stack frames, `code` / `digest`, and a clean
 * `cause` — never the extra fields drivers attach (`params`, `detail`, …).
 */
export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return sanitizeText(value);
  if (value === null || typeof value !== "object") return value;
  if (depth > MAX_DEPTH) return "[removed]";

  if (value instanceof Error) {
    const clean = new Error(sanitizeText(value.message));
    clean.name = value.name;
    // The stack starts with the message; keep only the frames after it.
    const frames = value.stack?.indexOf("\n    at ") ?? -1;
    clean.stack = `${clean.name}: ${clean.message}${frames < 0 ? "" : value.stack?.slice(frames)}`;
    if (value.cause !== undefined) {
      clean.cause = sanitizeForLog(value.cause, depth + 1);
    }
    for (const key of ["code", "digest"]) {
      const kept = (value as unknown as Record<string, unknown>)[key];
      if (typeof kept === "string") Object.assign(clean, { [key]: kept });
    }
    return clean;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item, depth + 1));
  }
  const proto: unknown = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      PERSONAL_KEY.test(key) ? "[removed]" : sanitizeForLog(item, depth + 1),
    ]),
  );
}

/** The parts of a Sentry event that can carry personal data. */
interface SentryEventLike {
  message?: string;
  exception?: { values?: { value?: string }[] };
  extra?: Record<string, unknown>;
  breadcrumbs?: { message?: string; data?: Record<string, unknown> }[];
  request?: {
    cookies?: unknown;
    data?: unknown;
    query_string?: unknown;
    headers?: Record<string, string>;
  };
  user?: { id?: string | number };
}

/**
 * `beforeSend` safety net: whatever built the event, it leaves without bound
 * query values, emails, phone numbers, personal keys, request bodies (a
 * profile form carries a phone and an emergency contact), cookies, the
 * authorization header, or any user field but the id.
 */
export function scrubEvent(event: SentryEventLike): void {
  if (event.message) event.message = sanitizeText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = sanitizeText(exception.value);
  }
  if (event.extra) {
    event.extra = sanitizeForLog(event.extra) as Record<string, unknown>;
  }
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = sanitizeText(crumb.message);
    if (crumb.data) {
      crumb.data = sanitizeForLog(crumb.data) as Record<string, unknown>;
    }
  }
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (typeof event.request.query_string === "string") {
      event.request.query_string = sanitizeText(event.request.query_string);
    }
    delete event.request.headers?.cookie;
    delete event.request.headers?.authorization;
  }
  if (event.user) event.user = { id: event.user.id };
}

/**
 * Route `console.error` / `console.warn` through the sanitiser. Next.js logs
 * an error itself when a server action or page throws without a catch block
 * (a failed query, with its values), so this is what covers those.
 */
export function installLogSanitiser(
  target: Pick<Console, "error" | "warn"> = console,
): void {
  for (const level of ["error", "warn"] as const) {
    const original = target[level].bind(target);
    target[level] = (...args: unknown[]) => {
      let safe: unknown[];
      try {
        safe = args.map((arg) => sanitizeForLog(arg));
      } catch {
        // Privacy first: an entry that can't be cleaned isn't written.
        safe = ["[log entry dropped: sanitiser failed]"];
      }
      original(...safe);
    };
  }
}
