"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GpxUploader } from "@/components/features/trails/gpx-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ParsedGpx } from "@/lib/gpx/parser";
import { difficultyLabels } from "@/lib/i18n/labels";
import { submitTrail } from "@/server/actions/gpx";

const DIFFICULTIES = ["easy", "moderate", "hard", "expert"] as const;

export function TrailSubmitForm() {
  const router = useRouter();
  const [gpx, setGpx] = useState<{ content: string; parsed: ParsedGpx } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTIES)[number]>("moderate");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!gpx) {
      setError("Ngarko një skedar GPX.");
      return;
    }
    if (!name.trim()) {
      setError("Shkruaj emrin e shtegut.");
      return;
    }
    setLoading(true);
    const result = await submitTrail({
      name,
      region,
      city,
      difficulty,
      description,
      gpxContent: gpx.content,
    });
    setLoading(false);
    if (!result.success || !result.slug) {
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    router.push(`/trails/${result.slug}`);
  }

  return (
    <div className="space-y-6">
      <GpxUploader
        onParsed={(content, parsed) => {
          setGpx({ content, parsed });
          if (!name) setName(parsed.name);
        }}
      />

      <div className="space-y-1.5">
        <Label htmlFor="trail-name">Emri i shtegut</Label>
        <Input
          id="trail-name"
          className="h-9"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="trail-region">Rajoni</Label>
          <Input
            id="trail-region"
            className="h-9"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trail-city">Qyteti</Label>
          <Input
            id="trail-city"
            className="h-9"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="trail-difficulty">Vështirësia</Label>
        <select
          id="trail-difficulty"
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value as (typeof DIFFICULTIES)[number])
          }
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {difficultyLabels[d]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="trail-desc">Përshkrimi</Label>
        <Textarea
          id="trail-desc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button onClick={submit} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : null}
        Dërgo shtegun
      </Button>
      <p className="text-xs text-muted-foreground">
        Shtegu do të shqyrtohet përpara se të verifikohet publikisht.
      </p>
    </div>
  );
}
