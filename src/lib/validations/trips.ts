import { z } from "zod";

// Numeric fields come from <input type="number">: an empty box is NaN, which
// zod would otherwise report in English.
const wholeNumber = (label: string) =>
  z
    .number({ error: `Shkruani ${label}.` })
    .int(
      `${label[0]?.toUpperCase()}${label.slice(1)} duhet të jetë numër i plotë.`,
    )
    .positive(
      `${label[0]?.toUpperCase()}${label.slice(1)} duhet të jetë më i madh se 0.`,
    );

const difficultyEnum = z.enum(["easy", "moderate", "hard", "expert"]);

export const createTripSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Të paktën 3 karaktere")
      .max(200, "Maksimumi 200 karaktere"),
    description: z
      .string()
      .trim()
      .max(5000, "Maksimumi 5000 karaktere")
      .optional()
      .or(z.literal("")),
    trailId: z.uuid().optional().or(z.literal("")),
    difficulty: difficultyEnum.optional(),
    // ISO datetime-local strings from the form.
    startDatetime: z.string().min(1, "Zgjidhni datën e nisjes"),
    endDatetime: z.string().optional().or(z.literal("")),
    meetingPoint: z
      .string()
      .trim()
      .max(500, "Maksimumi 500 karaktere")
      .optional()
      .or(z.literal("")),
    meetingLat: z.number().optional(),
    meetingLng: z.number().optional(),
    maxParticipants: wholeNumber("numrin maksimal").optional(),
    minParticipants: wholeNumber("numrin minimal"),
    requirements: z
      .string()
      .trim()
      .max(2000, "Maksimumi 2000 karaktere")
      .optional()
      .or(z.literal("")),
    included: z
      .string()
      .trim()
      .max(2000, "Maksimumi 2000 karaktere")
      .optional()
      .or(z.literal("")),
    priceEur: z
      .number({ error: "Shkruani çmimin (0 nëse është falas)." })
      .min(0, "Çmimi nuk mund të jetë negativ."),
    publish: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.endDatetime) return true;
      // Both are "YYYY-MM-DDTHH:mm" in the same (Kosovo) zone, so string
      // order is time order — no Date parsing, which would use the zone of
      // whichever machine runs this.
      return data.endDatetime > data.startDatetime;
    },
    { message: "Mbarimi duhet të jetë pas nisjes", path: ["endDatetime"] },
  )
  .refine(
    (data) =>
      data.maxParticipants == null ||
      data.maxParticipants >= data.minParticipants,
    {
      message: "Maksimumi nuk mund të jetë më i vogël se minimumi.",
      path: ["maxParticipants"],
    },
  )
  .refine((data) => Boolean(data.trailId) || Boolean(data.difficulty), {
    message: "Zgjidhni një shteg ose vështirësi",
    path: ["difficulty"],
  });

export type CreateTripInput = z.infer<typeof createTripSchema>;
