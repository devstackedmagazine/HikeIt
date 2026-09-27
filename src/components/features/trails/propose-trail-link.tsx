import { Plus } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export const SUBMIT_TRAIL_PATH = "/dashboard/trails/submit";

/**
 * "Propose a trail" entry point. Logged-out visitors are sent to login with a
 * return URL back to the submit form rather than to a page they can't open.
 */
export function ProposeTrailLink({
  isLoggedIn,
  tone = "light",
  label = "Propozo një shteg",
  className,
}: {
  isLoggedIn: boolean;
  /** "light" on Summit backgrounds (dashboard), "dark" on Abyss (/trails). */
  tone?: "light" | "dark";
  label?: string;
  className?: string;
}) {
  const href = isLoggedIn
    ? SUBMIT_TRAIL_PATH
    : `/login?redirect=${encodeURIComponent(SUBMIT_TRAIL_PATH)}`;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 border-2 px-4 py-2.5 text-[10px] font-extrabold tracking-[0.1em] whitespace-nowrap uppercase transition-colors",
        tone === "light"
          ? "border-forest text-forest hover:bg-forest hover:text-summit"
          : "border-moss text-moss hover:bg-moss hover:text-abyss",
        className,
      )}
    >
      <Plus className="size-3.5 shrink-0" />
      {label}
    </Link>
  );
}
