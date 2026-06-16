import type { ReactNode } from "react";

import { Brand } from "@/components/shared/brand";
import { LogoutButton } from "@/components/shared/logout-button";
import { getRequiredUser } from "@/lib/auth/helpers";

/**
 * Dashboard shell: top nav with brand, the signed-in user's identity, and a
 * logout action. Placeholder — a proper sidebar lands in a later session.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getRequiredUser();
  const initial = (user.name ?? user.email).charAt(0).toUpperCase();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Brand />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {initial}
            </span>
            <span className="hidden text-sm font-medium sm:inline">
              {user.name ?? user.email}
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
