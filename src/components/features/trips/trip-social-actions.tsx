"use client";

import { Flag } from "lucide-react";

import { TripFavoriteButton } from "@/components/features/trips/trip-favorite-button";
import { ShareButton } from "@/components/shared/share-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TripSocialActionsProps {
  title: string;
  tripId: string;
  isSaved: boolean;
  isLoggedIn: boolean;
  returnPath: string;
}

export function TripSocialActions({
  title,
  tripId,
  isSaved,
  isLoggedIn,
  returnPath,
}: TripSocialActionsProps) {
  return (
    <TooltipProvider>
      <div className="border-summit/[0.06] flex items-center gap-3 border-t pt-4">
        <ShareButton title={title} className="size-11 md:size-8" />

        <TripFavoriteButton
          tripId={tripId}
          isSaved={isSaved}
          isLoggedIn={isLoggedIn}
          returnPath={returnPath}
          className="size-11 md:size-8"
        />

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label="Raporto"
                className="border-summit/40 text-summit/40 hover:border-summit/60 hover:text-summit/70 flex size-11 items-center justify-center border transition-colors md:size-8"
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
