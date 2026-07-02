import { z } from "zod";

const difficultyEnum = z.enum(["easy", "moderate", "hard", "expert"]);

export const createTripSchema = z
  .object({
    title: z.string().trim().min(3, "Të paktën 3 karaktere").max(200),
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    trailId: z.uuid().optional().or(z.literal("")),
    difficulty: difficultyEnum.optional(),
    // ISO datetime-local strings from the form.
    startDatetime: z.string().min(1, "Zgjidhni datën e nisjes"),
    endDatetime: z.string().optional().or(z.literal("")),
    meetingPoint: z.string().trim().max(500).optional().or(z.literal("")),
    meetingLat: z.number().optional(),
    meetingLng: z.number().optional(),
    maxParticipants: z.number().int().positive().optional(),
    minParticipants: z.number().int().positive(),
    requirements: z.string().trim().max(2000).optional().or(z.literal("")),
    included: z.string().trim().max(2000).optional().or(z.literal("")),
    priceEur: z.number().min(0),
    publish: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.endDatetime) return true;
      return new Date(data.endDatetime) > new Date(data.startDatetime);
    },
    { message: "Mbarimi duhet të jetë pas nisjes", path: ["endDatetime"] },
  )
  .refine((data) => Boolean(data.trailId) || Boolean(data.difficulty), {
    message: "Zgjidhni një shteg ose vështirësi",
    path: ["difficulty"],
  });

export type CreateTripInput = z.infer<typeof createTripSchema>;
