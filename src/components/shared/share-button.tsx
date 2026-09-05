"use client";

import { Check, Share2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

interface ShareButtonProps {
  title: string;
  className?: string;
}

export function ShareButton({ title, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showConfirmation = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  async function fallbackCopy(text: string): Promise<boolean> {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Clipboard API denied — fall through to execCommand.
      }
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // User dismissed share sheet or API unavailable — fall through to copy.
      }
    }
    const ok = await fallbackCopy(url);
    if (ok) showConfirmation();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Ndaj"
        className={cn(
          "flex items-center justify-center border transition-colors",
          copied
            ? "border-moss/50 text-moss"
            : "border-summit/15 bg-summit/[0.05] text-summit/50 hover:text-summit",
          className,
        )}
      >
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      </button>
      {copied ? (
        <span className="text-[10px] font-bold tracking-[0.04em] text-moss uppercase">
          LIDHJA U KOPJUA
        </span>
      ) : null}
    </div>
  );
}
