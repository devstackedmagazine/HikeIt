"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { cn } from "@/lib/utils/cn";

interface FavoriteButtonProps {
  isSaved: boolean;
  isLoggedIn: boolean;
  returnPath: string;
  onToggle: () => Promise<{ success: boolean; saved?: boolean; error?: string }>;
  className?: string;
}

export function FavoriteButton({
  isSaved,
  isLoggedIn,
  returnPath,
  onToggle,
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(isSaved);

  function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }

    startTransition(async () => {
      setOptimisticSaved(!optimisticSaved);
      const result = await onToggle();
      if (!result.success) {
        setOptimisticSaved(isSaved);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={optimisticSaved ? "Hiq nga të ruajtura" : "Ruaj"}
      className={cn(
        "flex items-center justify-center border transition-colors",
        optimisticSaved
          ? "border-moss/50 bg-abyss/85 text-moss"
          : "border-summit/15 bg-summit/[0.05] text-summit/50 hover:text-summit",
        className,
      )}
    >
      <Heart
        className={cn("size-4", optimisticSaved && "fill-moss")}
      />
    </button>
  );
}
