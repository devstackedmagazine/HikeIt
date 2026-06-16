import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

/**
 * Catch-all handler for every Better Auth endpoint
 * (`/api/auth/sign-in`, `/sign-up`, `/verify-email`, `/reset-password`, …).
 */
export const { GET, POST } = toNextJsHandler(auth);
