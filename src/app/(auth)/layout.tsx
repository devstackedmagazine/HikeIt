import type { ReactNode } from "react";

import { Brand } from "@/components/shared/brand";

/** Centered shell for all auth pages, with the HikeIt brand pinned at top. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8">
        <Brand className="text-2xl" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
