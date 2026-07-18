"use client";

import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  CONDITION_OPTIONS,
  conditionLabels,
} from "@/lib/validations/reviews";
import { submitTrailReview } from "@/server/actions/reviews";

export function ReviewForm({ trailId }: { trailId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [condition, setCondition] = useState("Mesatar");
  const [hikedAt, setHikedAt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Zgjidhni një vlerësim.");
      return;
    }
    setStatus("loading");
    const result = await submitTrailReview({
      trailId,
      rating,
      comment: comment || undefined,
      conditionReport: condition
        ? (condition as (typeof CONDITION_OPTIONS)[number])
        : undefined,
      hikedAt: hikedAt || undefined,
    });
    if (!result.success) {
      setStatus("idle");
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    setStatus("done");
    router.refresh();
  }

  if (status === "done") {
    return (
      <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
        Faleminderit për vlerësimin tuaj!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4">
      <div className="space-y-1.5">
        <Label>Vlerësimi</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i} yje`}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  i <= (hovered || rating)
                    ? "fill-accent text-accent"
                    : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-comment">Koment</Label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Si ishte shtegu?"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="review-condition">Gjendja e shtegut</Label>
          <select
            id="review-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">—</option>
            {CONDITION_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {conditionLabels[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-date">Data e ngjitjes</Label>
          <input
            id="review-date"
            type="date"
            value={hikedAt}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setHikedAt(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? (
          <>
            <Loader2 className="animate-spin" />
            Duke dërguar…
          </>
        ) : (
          "Dërgo vlerësimin"
        )}
      </Button>
    </form>
  );
}
