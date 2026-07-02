import type { ReactNode } from "react";

import { Brand } from "@/components/shared/brand";

/**
 * Centered card shell for the secondary auth pages (login, forgot/reset
 * password, verify email). The auth layout itself is now a bare passthrough so
 * the register page can own a full-viewport split, so these pages opt back into
 * the centered treatment here.
 */
export function AuthCardShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8">
        <Brand className="text-2xl" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
