import { Mountain } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Difficulty = "easy" | "moderate" | "hard" | "expert";

const CONFIG: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: "E LEHTË", className: "bg-moss text-abyss border-moss" },
  moderate: { label: "E MESME", className: "bg-alert text-abyss border-alert" },
  hard: { label: "E VËSHTIRË", className: "bg-sunset text-summit border-sunset" },
  expert: { label: "EKSPERT", className: "bg-danger text-summit border-danger" },
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
        "inline-flex items-center gap-1 border-2 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest",
        CONFIG[difficulty].className,
        className,
      )}
    >
      <Mountain className="size-3" />
      {CONFIG[difficulty].label}
    </span>
  );
}
