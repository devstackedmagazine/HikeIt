"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ChevronDown,
  CreditCard,
  Loader2,
  Search,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CoverPhotoUploader } from "@/components/features/images/cover-photo-uploader";
import {
  type Difficulty,
  DifficultySelector,
} from "@/components/features/trips/difficulty-selector";
import { cn } from "@/lib/utils/cn";
import { type CreateTripInput, createTripSchema } from "@/lib/validations/trips";
import { createTrip, updateTrip } from "@/server/actions/trips";
import type { TrailOption } from "@/server/queries/trails";

const ClickableMap = dynamic(
  () =>
    import("@/components/features/trips/clickable-map").then(
      (m) => m.ClickableMap,
    ),
  { ssr: false, loading: () => <div className="size-full" /> },
);

const INPUT =
  "h-10 w-full border border-summit/15 bg-summit/[0.05] px-3.5 text-[13px] font-medium text-summit placeholder:text-summit/20 placeholder:italic focus:border-moss/50 focus:outline-none";

const EMPTY_VALUES: CreateTripInput = {
  title: "",
  description: "",
  trailId: "",
  startDatetime: "",
  endDatetime: "",
  meetingPoint: "",
  minParticipants: 5,
  maxParticipants: 20,
  priceEur: 0,
  requirements: "",
  included: "",
  publish: false,
};

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-summit/10 bg-summit/[0.04] p-5">
      <p className="mb-4 border-b border-summit/[0.06] pb-2.5 text-[9px] font-bold tracking-[0.15em] text-summit/30 uppercase">
        {number}. {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold tracking-[0.1em] text-summit/50 uppercase">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-[10px] text-danger">{error}</p> : null}
    </div>
  );
}

export function TripForm({
  clubSlug,
  trailOptions,
  stripeActive,
  mode = "create",
  tripId,
  tripSlug,
  initialValues,
}: {
  clubSlug: string;
  trailOptions: TrailOption[];
  stripeActive: boolean;
  mode?: "create" | "edit";
  tripId?: string;
  tripSlug?: string;
  initialValues?: Partial<CreateTripInput>;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
    defaultValues: { ...EMPTY_VALUES, ...initialValues },
  });
  const { register, watch, setValue, trigger, getValues } = form;
  const errors = form.formState.errors;

  const initialLatLng =
    initialValues?.meetingLat != null && initialValues?.meetingLng != null
      ? { lat: initialValues.meetingLat, lng: initialValues.meetingLng }
      : null;

  async function submit(publish: boolean) {
    setFormError(null);
    setValue("publish", publish);
    if (!(await trigger())) return;

    setSubmitting(true);
    try {
      if (mode === "edit" && tripId) {
        const result = await updateTrip(tripId, getValues());
        if (!result.success) {
          setFormError(result.error ?? "Diçka shkoi keq.");
          return;
        }
        router.push(`/dashboard/club/${clubSlug}/trips/${tripSlug ?? ""}`);
        router.refresh();
        return;
      }
      const result = await createTrip(clubSlug, getValues());
      if (!result.success || !result.slug) {
        setFormError(result.error ?? "Diçka shkoi keq.");
        return;
      }
      router.push(`/dashboard/club/${clubSlug}/trips/${result.slug}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {/* 01 — Basic info */}
      <Section number="01" title="Informacione bazë">
        <Field label="Titulli i udhëtimit" error={errors.title?.message}>
          <input
            className={INPUT}
            placeholder="Për: Ngjitja në Gjeravicë..."
            {...register("title")}
          />
        </Field>
        <Field label="Përshkrimi i detajuar" error={errors.description?.message}>
          <textarea
            className={cn(INPUT, "h-25 py-2.5")}
            placeholder="Përshkruani eksperiencën, çfarë të prisni..."
            {...register("description")}
          />
        </Field>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label="Shtegu (kërko)">
            <div className="flex h-10 items-center gap-2 border border-summit/15 bg-summit/[0.05] px-3.5">
              <Search className="size-3.5 shrink-0 text-summit/30" />
              <select
                className="flex-1 appearance-none bg-transparent text-[13px] text-summit focus:outline-none"
                {...register("trailId")}
              >
                <option value="" className="text-abyss">
                  Zgjidh shtegun...
                </option>
                {trailOptions.map((t) => (
                  <option key={t.id} value={t.id} className="text-abyss">
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3.5 shrink-0 text-summit/30" />
            </div>
          </Field>
          <Field label="Vështirësia" error={errors.difficulty?.message}>
            <DifficultySelector
              value={watch("difficulty") as Difficulty | undefined}
              onChange={(v) =>
                setValue("difficulty", v, { shouldValidate: true })
              }
            />
          </Field>
        </div>
      </Section>

      {/* Cover photo (standalone, outside cards) */}
      <CoverPhotoUploader />

      {/* 02 — Date & location */}
      <Section number="02" title="Data dhe vendndodhja">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nisja (data/ora)" error={errors.startDatetime?.message}>
            <input
              type="datetime-local"
              className={INPUT}
              {...register("startDatetime")}
            />
          </Field>
          <Field label="Kthimi (data/ora)" error={errors.endDatetime?.message}>
            <input
              type="datetime-local"
              className={INPUT}
              {...register("endDatetime")}
            />
          </Field>
        </div>
        <Field label="Pika e takimit" error={errors.meetingPoint?.message}>
          <input
            className={INPUT}
            placeholder="Psh: Te Sheshi i Mirë, Prishtinë"
            {...register("meetingPoint")}
          />
        </Field>
        <Field label="Harta e takimit">
          <div className="relative h-45 overflow-hidden border border-summit/10 bg-[#0F2818]">
            <ClickableMap
              initial={initialLatLng}
              onSelect={(lat, lng) => {
                setValue("meetingLat", lat);
                setValue("meetingLng", lng);
              }}
            />
            <span className="pointer-events-none absolute bottom-2 left-2 z-[400] border border-summit/20 bg-[rgba(13,31,20,0.85)] px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] text-summit/60 uppercase">
              Klikoni për të vendosur pikën
            </span>
          </div>
        </Field>
      </Section>

      {/* 03 — Participants */}
      <Section number="03" title="Pjesëmarrësit">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min. pjesëmarrës" error={errors.minParticipants?.message}>
            <input
              type="number"
              min={1}
              className={INPUT}
              {...register("minParticipants", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Max. pjesëmarrës" error={errors.maxParticipants?.message}>
            <input
              type="number"
              min={1}
              className={INPUT}
              {...register("maxParticipants", {
                setValueAs: (v) =>
                  v === "" || v == null ? undefined : Number(v),
              })}
            />
          </Field>
        </div>
        <Field
          label="Kërkesat (pajisjet etj.)"
          error={errors.requirements?.message}
        >
          <textarea
            className={cn(INPUT, "h-20 py-2.5")}
            placeholder="Këpucë për ecje, ujë 2L, rroba rezervë..."
            {...register("requirements")}
          />
        </Field>
        <Field label="Çfarë përfshihet" error={errors.included?.message}>
          <textarea
            className={cn(INPUT, "h-15 py-2.5")}
            placeholder="Transporti, Guida, Shujta..."
            {...register("included")}
          />
        </Field>
      </Section>

      {/* 04 — Price */}
      <Section number="04" title="Çmimi">
        <p className="font-heading text-sm font-extrabold text-summit/60 uppercase">
          Kostoja për person
        </p>
        <div className="flex h-11 items-center border border-summit/15 bg-summit/[0.05]">
          <span className="font-heading border-r border-summit/10 px-3 text-base font-bold text-summit/30">
            €
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            className="font-heading h-full flex-1 bg-transparent px-3.5 text-base font-bold text-summit placeholder:text-summit/15 focus:outline-none"
            {...register("priceEur", {
              setValueAs: (v) => (v === "" || v == null ? 0 : Number(v)),
            })}
          />
        </div>
        {stripeActive ? (
          <div className="flex items-start gap-2.5 border border-moss/15 bg-moss/5 px-3.5 py-3">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-moss" />
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-[0.08em] text-moss uppercase">
                Stripe Connect e aktivizuar
              </p>
              <p className="text-[11px] leading-[1.55] text-summit/40">
                Pagesat do të procesohen automatikisht dhe do të transferohen në
                llogarinë tuaj bankare pas zbritjes së komisionit të platformës
                (2.5%).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 border border-alert/30 bg-alert/10 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-alert" />
            <p className="text-[11px] leading-[1.55] text-alert">
              <span className="font-bold tracking-[0.06em] uppercase">
                Stripe nuk është aktiv
              </span>{" "}
              — mund ta ruani udhëtimin me çmim, por{" "}
              <Link
                href={`/dashboard/club/${clubSlug}?tab=settings`}
                className="font-bold underline underline-offset-2"
              >
                lidhni Stripe në cilësimet e klubit
              </Link>{" "}
              për të mbledhur pagesa.
            </p>
          </div>
        )}
      </Section>

      {formError ? <p className="text-sm text-danger">{formError}</p> : null}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        {mode === "edit" ? (
          <button
            type="button"
            disabled={submitting}
            onClick={() => submit(initialValues?.publish ?? true)}
            className="flex items-center gap-2 border border-moss/40 bg-moss/20 px-6 py-3 text-xs font-extrabold tracking-[0.08em] text-moss uppercase transition-colors hover:bg-moss/30 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Ruaj ndryshimet
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => submit(false)}
              className="border border-summit/25 px-6 py-3 text-xs font-bold tracking-[0.08em] text-summit/60 uppercase transition-colors hover:border-summit/40 hover:text-summit/80 disabled:opacity-50"
            >
              Ruaj si draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => submit(true)}
              className="flex items-center gap-2 border border-moss/40 bg-moss/20 px-6 py-3 text-xs font-extrabold tracking-[0.08em] text-moss uppercase transition-colors hover:bg-moss/30 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Publiko tani →
            </button>
          </>
        )}
      </div>
    </form>
  );
}
