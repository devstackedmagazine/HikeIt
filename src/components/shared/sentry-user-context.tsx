"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Attaches the current user's identity to all Sentry events for this
 * session, so an error report shows *who* hit it. Renders nothing.
 */
export function SentryUserContext({
  id,
  email,
  name,
}: {
  id: string;
  email: string;
  name?: string | null;
}) {
  useEffect(() => {
    Sentry.setUser({ id, email, username: name ?? undefined });
    return () => Sentry.setUser(null);
  }, [id, email, name]);

  return null;
}
