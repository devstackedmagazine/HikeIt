import type { ReactNode } from "react";

/**
 * Bare passthrough so each auth page controls its own full-viewport layout.
 * The register page renders a 50/50 split; the other auth pages opt into a
 * centered card via `AuthCardShell`.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
