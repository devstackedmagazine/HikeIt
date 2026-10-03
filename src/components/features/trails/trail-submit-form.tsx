"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  BRUTAL_INPUT,
  BRUTAL_INPUT_HEIGHT,
  Field,
  Section,
} from "@/components/features/forms/brutal-form";
import { GpxUploader } from "@/components/features/trails/gpx-uploader";
import {
  type Difficulty,
  DifficultySelector,
} from "@/components/features/trips/difficulty-selector";
import type { ParsedGpx } from "@/lib/gpx/parser";
import { cn } from "@/lib/utils/cn";
import {
  OTHER_REGION,
  type SubmitTrailField,
  submitTrailSchema,
} from "@/lib/validations/trail-submit";
import { submitTrail } from "@/server/actions/gpx";

type FieldErrors = Partial<Record<SubmitTrailField, string>>;

const INPUT = cn(BRUTAL_INPUT, BRUTAL_INPUT_HEIGHT);

/** Props for a control that may carry an error under its Field. */
function invalidProps(errors: FieldErrors, field: SubmitTrailField) {
  return errors[field]
    ? { "aria-invalid": true, "aria-describedby": `${field}-error` }
    : {};
}

export function TrailSubmitForm({ regions }: { regions: string[] }) {
  const router = useRouter();
  const [gpx, setGpx] = useState<{ content: string; parsed: ParsedGpx } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [regionOther, setRegionOther] = useState("");
  const [city, setCity] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("moderate");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const values = {
      name,
      region,
      regionOther: region === OTHER_REGION ? regionOther : undefined,
      city,
      difficulty,
      description,
    };
    const next: FieldErrors = {};
    if (!gpx) next.gpx = "Ngarko një skedar GPX.";
    const check = submitTrailSchema.safeParse(values);
    if (!check.success) {
      for (const issue of check.error.issues) {
        const key = issue.path[0] as SubmitTrailField | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
    }
    setErrors(next);
    if (!gpx || Object.keys(next).length > 0) return;

    setLoading(true);
    const result = await submitTrail({ ...values, gpxContent: gpx.content });
    if (!result.success) {
      setLoading(false);
      setErrors(result.fieldErrors ?? {});
      // Field-specific problems are shown at the field; the summary goes
      // above the button only when nothing more specific is.
      setFormError(
        result.fieldErrors && Object.keys(result.fieldErrors).length > 0
          ? "Kontrollo fushat e shënuara."
          : (result.error ?? "Diçka shkoi keq."),
      );
      return;
    }
    // Stays in the loading state through the navigation.
    router.push("/trails?submitted=1");
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Section number="01" title="Skedari GPX">
        <GpxUploader
          tone="dark"
          error={errors.gpx}
          onParsed={(content, parsed) => {
            setGpx({ content, parsed });
            setErrors((prev) => ({ ...prev, gpx: undefined }));
            if (!name) setName(parsed.name);
          }}
          onCleared={() => setGpx(null)}
        />
      </Section>

      <Section number="02" title="Informacione">
        <Field
          label="Emri i shtegut"
          htmlFor="trail-name"
          error={errors.name}
          errorId="name-error"
        >
          <input
            id="trail-name"
            className={INPUT}
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            {...invalidProps(errors, "name")}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Rajoni"
            htmlFor="trail-region"
            error={errors.region}
            errorId="region-error"
          >
            <div className="relative">
              <select
                id="trail-region"
                className={cn(INPUT, "appearance-none pr-9")}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                {...invalidProps(errors, "region")}
              >
                {/* Native options render on the OS popup's light surface. */}
                <option value="" className="text-abyss">
                  Zgjidh rajonin...
                </option>
                {regions.map((r) => (
                  <option key={r} value={r} className="text-abyss">
                    {r}
                  </option>
                ))}
                <option value={OTHER_REGION} className="text-abyss">
                  Tjetër
                </option>
              </select>
              <ChevronDown className="text-summit/60 pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2" />
            </div>
          </Field>
          <Field
            label="Qyteti"
            htmlFor="trail-city"
            error={errors.city}
            errorId="city-error"
          >
            <input
              id="trail-city"
              className={INPUT}
              value={city}
              maxLength={80}
              onChange={(e) => setCity(e.target.value)}
              {...invalidProps(errors, "city")}
            />
          </Field>
        </div>

        {region === OTHER_REGION ? (
          <Field
            label="Rajoni (tjetër)"
            htmlFor="trail-region-other"
            error={errors.regionOther}
            errorId="regionOther-error"
          >
            <input
              id="trail-region-other"
              className={INPUT}
              value={regionOther}
              maxLength={60}
              required
              placeholder="p.sh. Bjeshkët e Nemuna"
              onChange={(e) => setRegionOther(e.target.value)}
              {...invalidProps(errors, "regionOther")}
            />
          </Field>
        ) : null}

        <Field label="Vështirësia" error={errors.difficulty}>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </Field>
      </Section>

      <Section number="03" title="Përshkrimi">
        <Field
          label="Përshkrimi"
          htmlFor="trail-desc"
          error={errors.description}
          errorId="description-error"
        >
          <textarea
            id="trail-desc"
            rows={5}
            className={cn(INPUT, "py-2.5 leading-[1.6]")}
            placeholder="Si arrihet, çfarë të presësh, sezoni më i mirë..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            {...invalidProps(errors, "description")}
          />
        </Field>
      </Section>

      {formError ? (
        <p role="alert" className="text-alert text-sm">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="bg-moss text-abyss hover:bg-sage focus-visible:ring-summit flex w-full items-center justify-center gap-2 px-6 py-3.5 text-xs font-extrabold tracking-[0.08em] uppercase transition-colors outline-none focus-visible:ring-2 disabled:opacity-60 sm:w-auto"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {loading ? "Duke dërguar…" : "Dërgo shtegun"}
      </button>
    </form>
  );
}
