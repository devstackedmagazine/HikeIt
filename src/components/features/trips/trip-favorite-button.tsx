"use client";

import { FavoriteButton } from "@/components/shared/favorite-button";
import { toggleTripFavorite } from "@/server/actions/favorites";

interface TripFavoriteButtonProps {
  tripId: string;
  isSaved: boolean;
  isLoggedIn: boolean;
  returnPath: string;
  className?: string;
}

export function TripFavoriteButton({
  tripId,
  isSaved,
  isLoggedIn,
  returnPath,
  className,
}: TripFavoriteButtonProps) {
  return (
    <FavoriteButton
      isSaved={isSaved}
      isLoggedIn={isLoggedIn}
      returnPath={returnPath}
      onToggle={() => toggleTripFavorite(tripId)}
      className={className}
    />
  );
}
