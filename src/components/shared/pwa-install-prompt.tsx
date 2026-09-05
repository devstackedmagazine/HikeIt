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
  if ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) return true;
  return false;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
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
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 border-2 border-moss/30 bg-abyss p-3 shadow-lg md:hidden">
      <Download className="size-5 shrink-0 text-moss" />
      <div className="flex-1">
        {showIos ? (
          <p className="text-[11px] font-medium leading-[1.4] text-summit/70">
            <span className="font-bold tracking-[0.04em] text-summit uppercase">
              SHTO NË EKRAN KRYESOR
            </span>
            <br />
            Shtyp{" "}
            <Share className="mb-0.5 inline size-3.5 text-moss" />{" "}
            pastaj &quot;Add to Home Screen&quot;
          </p>
        ) : (
          <p className="text-[11px] font-bold tracking-[0.04em] text-summit uppercase">
            INSTALO HIKEIT PËR AKSES MË TË SHPEJTË
          </p>
        )}
      </div>
      {hasDeferred ? (
        <Button
          size="sm"
          onClick={install}
          className="border-2 border-moss bg-moss text-abyss hover:bg-pine"
        >
          INSTALO
        </Button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Mbyll"
        className="flex size-7 items-center justify-center border border-summit/15 text-summit/40 hover:text-summit"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
