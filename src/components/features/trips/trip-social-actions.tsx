"use client";

import { Flag, Heart, Share2 } from "lucide-react";
import { useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

/** Share / Save / Flag row on the trip detail page. Save and Flag are
 * placeholders pending the social layer; Share copies the page URL. */
export function TripSocialActions() {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied or unavailable — fail silently, no confirmation shown.
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 border-t border-summit/[0.06] pt-4">
        <button
          type="button"
          onClick={share}
          aria-label="Kopjo lidhjen"
          className={cn(
            "flex size-11 items-center justify-center border transition-colors md:size-8",
            copied
              ? "border-moss/50 text-moss"
              : "border-summit/15 text-summit/40 hover:border-summit/30 hover:text-summit/70",
          )}
        >
          <Share2 className="size-3.5" />
        </button>
        {copied ? (
          <span className="text-[10px] font-bold tracking-[0.04em] text-moss uppercase">
            Lidhja u kopjua!
          </span>
        ) : null}

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label="Ruaj"
                className="flex size-11 items-center justify-center border border-summit/15 text-summit/40 transition-colors hover:border-summit/30 hover:text-summit/70 md:size-8"
              />
            }
          >
            <Heart className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent>Duke ardhur së shpejti...</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label="Raporto"
                className="flex size-11 items-center justify-center border border-summit/15 text-summit/40 transition-colors hover:border-summit/30 hover:text-summit/70 md:size-8"
              />
            }
          >
            <Flag className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent>Raporto një problem — së shpejti</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
