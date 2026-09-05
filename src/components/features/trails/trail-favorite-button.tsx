"use client";

import { FavoriteButton } from "@/components/shared/favorite-button";
import { toggleTrailFavorite } from "@/server/actions/favorites";

interface TrailFavoriteButtonProps {
  trailId: string;
  isSaved: boolean;
  isLoggedIn: boolean;
  returnPath: string;
  className?: string;
}

export function TrailFavoriteButton({
  trailId,
  isSaved,
  isLoggedIn,
  returnPath,
  className,
}: TrailFavoriteButtonProps) {
  return (
    <FavoriteButton
      isSaved={isSaved}
      isLoggedIn={isLoggedIn}
      returnPath={returnPath}
      onToggle={() => toggleTrailFavorite(trailId)}
      className={className}
    />
  );
}
