import { Mountain } from "lucide-react";

import { difficultyLabels } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils/cn";

type Difficulty = "easy" | "moderate" | "hard" | "expert";

const STYLES: Record<Difficulty, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  moderate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  hard: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  expert: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[difficulty],
        className,
      )}
    >
      <Mountain className="size-3" />
      {difficultyLabels[difficulty]}
    </span>
  );
}
