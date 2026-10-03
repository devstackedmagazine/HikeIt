import { z } from "zod";

/** Select value for "Tjetër" — a region not yet on any published trail. */
export const OTHER_REGION = "__other__";

export const submitTrailSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Shkruaj emrin e shtegut.")
      .max(120, "Emri është shumë i gjatë."),
    region: z.string().min(1, "Zgjidh rajonin."),
    regionOther: z.string().trim().optional(),
    city: z.string().trim().max(80, "Qyteti është shumë i gjatë.").optional(),
    difficulty: z.enum(["easy", "moderate", "hard", "expert"]),
    description: z
      .string()
      .trim()
      .max(5000, "Përshkrimi është shumë i gjatë.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.region !== OTHER_REGION) return;
    const other = data.regionOther ?? "";
    if (other.length < 2 || other.length > 60) {
      ctx.addIssue({
        code: "custom",
        path: ["regionOther"],
        message: "Shkruaj rajonin (2–60 karaktere).",
      });
    }
  });

export type SubmitTrailInput = z.infer<typeof submitTrailSchema>;
export type SubmitTrailField = keyof SubmitTrailInput | "gpx";
