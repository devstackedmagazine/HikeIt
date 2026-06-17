"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { generateSlug } from "@/lib/utils/slug";
import {
  CLUB_CITIES,
  type CreateClubInput,
  createClubSchema,
} from "@/lib/validations/club";
import { checkSlugAvailability, createClub } from "@/server/actions/clubs";

const STEP_FIELDS: Record<number, (keyof CreateClubInput)[]> = {
  1: ["name", "slug", "description", "city", "foundedYear"],
  2: ["website", "instagram", "facebook"],
};

export function ClubWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [slugEdited, setSlugEdited] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateClubInput>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      city: "",
      website: "",
      instagram: "",
      facebook: "",
    },
  });

  const values = useWatch({ control: form.control });

  async function checkSlug(slug: string) {
    if (!slug) return setSlugStatus("idle");
    setSlugStatus("checking");
    const available = await checkSlugAvailability(slug);
    setSlugStatus(available ? "available" : "taken");
  }

  async function next() {
    const fields = STEP_FIELDS[step];
    const valid = fields ? await form.trigger(fields) : true;
    if (!valid) return;
    if (step === 1 && slugStatus === "taken") return;
    setStep((s) => Math.min(3, s + 1));
  }

  async function onSubmit(data: CreateClubInput) {
    setFormError(null);
    const result = await createClub(data);
    if (!result.success || !result.slug) {
      setFormError(result.error ?? "Diçka shkoi keq.");
      setStep(1);
      return;
    }
    router.push(`/dashboard/club/${result.slug}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              s <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {step === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>Informacioni bazë</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emri i klubit</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!slugEdited) {
                              const s = generateSlug(e.target.value);
                              form.setValue("slug", s);
                              void checkSlug(s);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL (slug)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            className="h-9 pr-9"
                            {...field}
                            onChange={(e) => {
                              setSlugEdited(true);
                              field.onChange(generateSlug(e.target.value));
                            }}
                            onBlur={() => void checkSlug(field.value)}
                          />
                          <span className="absolute top-1/2 right-3 -translate-y-1/2">
                            {slugStatus === "checking" ? (
                              <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            ) : slugStatus === "available" ? (
                              <Check className="size-4 text-primary" />
                            ) : slugStatus === "taken" ? (
                              <X className="size-4 text-destructive" />
                            ) : null}
                          </span>
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        hikeit.app/clubs/{field.value || "emri-klubit"}
                      </p>
                      {slugStatus === "taken" ? (
                        <p className="text-sm text-destructive">
                          Ky emër është i zënë.
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Përshkrimi</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qyteti</FormLabel>
                      <FormControl>
                        <select
                          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          {...field}
                        >
                          <option value="">Zgjidh qytetin</option>
                          {CLUB_CITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="foundedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Viti i themelimit</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>Kontakt & rrjete sociale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (opsionale)</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          placeholder="https://..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram (pa @)</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          placeholder="klubi_im"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook (opsionale)</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          placeholder="https://facebook.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ) : null}

          {step === 3 ? (
            <Card>
              <CardHeader>
                <CardTitle>Rishiko & krijo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Emri" value={values.name ?? ""} />
                <Row
                  label="URL"
                  value={`hikeit.app/clubs/${values.slug ?? ""}`}
                />
                <Row label="Qyteti" value={values.city ?? ""} />
                {values.foundedYear ? (
                  <Row label="Viti" value={String(values.foundedYear)} />
                ) : null}
                <Row label="Përshkrimi" value={values.description ?? ""} />
                {values.website ? (
                  <Row label="Website" value={values.website} />
                ) : null}
                {values.instagram ? (
                  <Row label="Instagram" value={`@${values.instagram}`} />
                ) : null}
                {formError ? (
                  <p className="text-sm text-destructive">{formError}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <div className="mt-6 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Kthehu
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={next}>
                Vazhdo
              </Button>
            ) : (
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Duke krijuar…
                  </>
                ) : (
                  "Krijo Klubin"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
