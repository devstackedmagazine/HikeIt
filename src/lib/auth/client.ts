import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "@/config/env";
import type { auth } from "@/lib/auth";

/**
 * Client-side Better Auth instance for use in client components.
 * `inferAdditionalFields` carries our custom `role`/`bio` user fields into the
 * client types so `useSession()` data is fully typed.
 */
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
