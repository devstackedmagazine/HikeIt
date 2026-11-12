"use client";

import { Check, Copy } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { isInAppBrowser } from "@/lib/utils/in-app-browser";

const noopSubscribe = () => () => {};

/** False on the server and the first client render, so hydration matches. */
export function useInAppBrowser(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => isInAppBrowser(navigator.userAgent),
    () => false,
  );
}

/** Webviews often lack the async Clipboard API; fall back to execCommand. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

/** Shown above the social buttons; email/password sign-in stays available. */
export function InAppBrowserNotice() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (await copyText(window.location.href)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div
      role="status"
      className="border-forest bg-mist text-forest mb-3 border-2 p-3"
    >
      <p className="text-[13px] leading-[1.5] font-semibold">
        Për hyrje me Google, hapeni faqen në Chrome ose Safari
      </p>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="bg-forest text-summit hover:bg-abyss mt-2.5 flex h-9 items-center gap-2 px-3.5 text-[11px] font-bold tracking-[0.08em] uppercase transition-colors"
      >
        {copied ? (
          <>
            <Check className="size-3.5" />U kopjua
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Kopjoni linkun
          </>
        )}
      </button>
    </div>
  );
}
