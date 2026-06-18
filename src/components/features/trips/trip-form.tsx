"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { difficultyLabels } from "@/lib/i18n/labels";
import { type CreateTripInput,createTripSchema } from "@/lib/validations/trips";
import { createTrip, updateTrip } from "@/server/actions/trips";
import type { TrailOption } from "@/server/queries/trails";

const DIFFICULTIES = ["easy", "moderate", "hard", "expert"] as const;

const EMPTY_VALUES: CreateTripInput = {
  title: "",
  description: "",
  trailId: "",
  startDatetime: "",
  endDatetime: "",
  meetingPoint: "",
  minParticipants: 1,
  priceEur: 0,
  requirements: "",
  included: "",
  publish: false,
};

export function TripForm({
  clubSlug,
  trailOptions,
  canCollectPayments,
  mode = "create",
  tripId,
  tripSlug,
  initialValues,
}: {
  clubSlug: string;
  trailOptions: TrailOption[];
  canCollectPayments: boolean;
  mode?: "create" | "edit";
  tripId?: string;
  tripSlug?: string;
  initialValues?: Partial<CreateTripInput>;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
    defaultValues: { ...EMPTY_VALUES, ...initialValues },
  });

  const priceValue = useWatch({ control: form.control, name: "priceEur" });

  async function submit(publish: boolean) {
    setFormError(null);
    form.setValue("publish", publish);
    const valid = await form.trigger();
    if (!valid) return;

    if (mode === "edit" && tripId) {
      const result = await updateTrip(tripId, form.getValues());
      if (!result.success) {
        setFormError(result.error ?? "Diçka shkoi keq.");
        return;
      }
      router.push(`/dashboard/club/${clubSlug}/trips/${tripSlug ?? ""}`);
      router.refresh();
      return;
    }

    const result = await createTrip(clubSlug, form.getValues());
    if (!result.success || !result.slug) {
      setFormError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    router.push(`/dashboard/club/${clubSlug}/trips/${result.slug}`);
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader>
            <CardTitle>Informacioni bazë</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulli</FormLabel>
                  <FormControl>
                    <Input className="h-9" {...field} />
                  </FormControl>
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
              name="trailId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shtegu (opsionale)</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                      {...field}
                    >
                      <option value="">Pa shteg</option>
                      {trailOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} · {difficultyLabels[t.difficulty]}
                          {t.region ? ` · ${t.region}` : ""}
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
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vështirësia (nëse pa shteg)</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                    >
                      <option value="">—</option>
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {difficultyLabels[d]}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data & vendi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDatetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nisja</FormLabel>
                    <FormControl>
                      <Input className="h-9" type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDatetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mbarimi (opsionale)</FormLabel>
                    <FormControl>
                      <Input className="h-9" type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="meetingPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pika e takimit</FormLabel>
                  <FormControl>
                    <Input
                      className="h-9"
                      placeholder="p.sh. Parkimi i Rugovës, afër urës"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pjesëmarrësit & çmimi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max pjesëmarrës (bosh = pa limit)</FormLabel>
                    <FormControl>
                      <Input
                        className="h-9"
                        type="number"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceEur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Çmimi (€)</FormLabel>
                    <FormControl>
                      <Input
                        className="h-9"
                        type="number"
                        min={0}
                        step="0.01"
                        disabled={!canCollectPayments}
                        title={
                          canCollectPayments
                            ? undefined
                            : "Kaloni te Pro për të mbledhur pagesa"
                        }
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!canCollectPayments ? (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Kaloni te Pro për të mbledhur pagesa online.
              </p>
            ) : Number(priceValue) > 0 ? (
              <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                Aktivizoni Stripe Connect te Cilësimet e klubit për të marrë
                pagesat.
              </p>
            ) : null}
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kërkesat</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="included"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Çfarë përfshihet</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {formError ? (
          <p className="text-sm text-destructive">{formError}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {mode === "edit" ? (
            <Button
              type="button"
              disabled={form.formState.isSubmitting}
              onClick={() => submit(initialValues?.publish ?? true)}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Ruaj Ndryshimet
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={form.formState.isSubmitting}
                onClick={() => submit(false)}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                Ruaj si Draft
              </Button>
              <Button
                type="button"
                disabled={form.formState.isSubmitting}
                onClick={() => submit(true)}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                Publiko Tani
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
