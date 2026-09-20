"use client";

import { Download, Share, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "hikeit_pwa_dismissed";
const DISMISS_DAYS = 30;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (
    "standalone" in navigator &&
    (navigator as { standalone?: boolean }).standalone === true
  )
    return true;
  return false;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  );
}

function wasDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const [showIos, setShowIos] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasDeferred, setHasDeferred] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const onPrompt = useCallback((e: Event) => {
    e.preventDefault();
    deferredRef.current = e as BeforeInstallPromptEvent;
    setHasDeferred(true);
  }, []);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    if (isIos()) {
      // Delay by one frame so the setState doesn't fire synchronously in the
      // effect body (React strict-mode / compiler lint).
      const id = requestAnimationFrame(() => setShowIos(true));
      return () => cancelAnimationFrame(id);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [onPrompt]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
    setShowIos(false);
    setHasDeferred(false);
  }

  async function install() {
    const deferred = deferredRef.current;
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferredRef.current = null;
    setHasDeferred(false);
  }

  const hidden =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");

  const visible = !dismissed && !hidden && (showIos || hasDeferred);
  if (!visible) return null;

  return (
    <div className="border-moss/30 bg-abyss fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 border-2 p-3 shadow-lg md:hidden">
      <Download className="text-moss size-5 shrink-0" />
      <div className="flex-1">
        {showIos ? (
          <p className="text-summit/70 text-[11px] leading-[1.4] font-medium">
            <span className="text-summit font-bold tracking-[0.04em] uppercase">
              SHTO NË EKRAN KRYESOR
            </span>
            <br />
            Shtyp <Share className="text-moss mb-0.5 inline size-3.5" /> pastaj
            &quot;Add to Home Screen&quot;
          </p>
        ) : (
          <p className="text-summit text-[11px] font-bold tracking-[0.04em] uppercase">
            INSTALO HIKEIT PËR AKSES MË TË SHPEJTË
          </p>
        )}
      </div>
      {hasDeferred ? (
        <Button
          size="sm"
          onClick={install}
          className="border-moss bg-moss text-abyss hover:bg-pine border-2"
        >
          INSTALO
        </Button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Mbyll"
        className="border-summit/40 text-summit/40 hover:text-summit flex size-7 items-center justify-center border"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
