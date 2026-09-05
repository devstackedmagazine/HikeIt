"use client";

import { Check, Link2, Loader2 } from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { getSocialErrorCopy, providerLabel } from "@/lib/auth/social-errors";
import { cn } from "@/lib/utils/cn";

type LinkableProvider = "google" | "facebook";

const LINKABLE_PROVIDERS: LinkableProvider[] = ["google", "facebook"];
const DISPLAY_ORDER = ["credential", "google", "facebook"] as const;

/**
 * Shows which auth methods are linked to the account and lets the user link
 * an additional social provider. Deliberately explicit-only — see
 * `src/lib/auth/index.ts` — this is the *only* place linking can happen, and
 * only for the currently authenticated session (`linkSocial` requires a
 * session server-side; there is no unauthenticated path to it).
 */
export function LinkedAccounts({
  linkedProviders,
  initialNotice,
}: {
  linkedProviders: string[];
  initialNotice: { tone: "success" | "error"; message: string } | null;
}) {
  const [pending, setPending] = useState<LinkableProvider | null>(null);
  const [notice, setNotice] = useState(initialNotice);
  const linked = new Set(linkedProviders);

  async function link(provider: LinkableProvider) {
    setNotice(null);
    setPending(provider);
    const { error } = await authClient.linkSocial({
      provider,
      callbackURL: `/dashboard/profile?linked=${provider}`,
      errorCallbackURL: "/dashboard/profile",
    });
    if (error) {
      setPending(null);
      setNotice({
        tone: "error",
        message: getSocialErrorCopy(error.code ?? undefined).message,
      });
    }
    // On success the API responds with a redirect and the browser navigates
    // away, so there's nothing to reset here.
  }

  return (
    <div>
      <p className="text-summit/40 mb-2 text-[10px] font-semibold tracking-[0.1em] uppercase">
        I lidhur
      </p>
      <div className="space-y-1.5">
        {DISPLAY_ORDER.map((id) => {
          const label = providerLabel(id) ?? id;
          const isLinked = linked.has(id);
          const isLinkable = (LINKABLE_PROVIDERS as string[]).includes(id);
          return (
            <div key={id} className="flex items-center justify-between gap-2">
              <span className="text-summit/60 text-[11px]">{label}</span>
              {isLinked ? (
                <span className="border-moss/25 bg-moss/15 text-moss flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold tracking-[0.06em] uppercase">
                  <Check className="size-2.5" strokeWidth={3} />
                  Lidhur
                </span>
              ) : isLinkable ? (
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => link(id as LinkableProvider)}
                  className={cn(
                    "border-summit/20 text-summit/50 hover:border-summit/40 hover:text-summit/80 flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold tracking-[0.06em] uppercase transition-colors disabled:opacity-40",
                  )}
                >
                  {pending === id ? (
                    <Loader2 className="size-2.5 animate-spin" />
                  ) : (
                    <Link2 className="size-2.5" />
                  )}
                  Lidh {label}
                </button>
              ) : (
                <span className="text-summit/25 text-[9px] uppercase">—</span>
              )}
            </div>
          );
        })}
      </div>
      {notice ? (
        <p
          className={cn(
            "mt-2 text-[10px] leading-[1.5]",
            notice.tone === "error" ? "text-danger" : "text-moss",
          )}
        >
          {notice.message}
        </p>
      ) : null}
    </div>
  );
}
