import { z } from "zod";

export const CLUB_CITIES = [
  "Prishtinë",
  "Pejë",
  "Prizren",
  "Gjakovë",
  "Gjilan",
  "Mitrovicë",
  "Ferizaj",
  "Vushtrri",
  "Tjetër",
] as const;

const currentYear = new Date().getFullYear();

export const clubBasicInfoSchema = z.object({
  name: z.string().trim().min(3, "Të paktën 3 karaktere").max(100),
  slug: z
    .string()
    .trim()
    .min(3, "Të paktën 3 karaktere")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Vetëm shkronja të vogla, numra dhe viza"),
  description: z
    .string()
    .trim()
    .min(50, "Të paktën 50 karaktere")
    .max(1000, "Maksimumi 1000 karaktere"),
  city: z.string().min(1, "Zgjidhni një qytet"),
  foundedYear: z
    .number()
    .int()
    .min(1900)
    .max(currentYear)
    .optional(),
});

export const clubContactSchema = z.object({
  website: z.url("URL e pavlefshme").optional().or(z.literal("")),
  instagram: z.string().trim().max(50).optional().or(z.literal("")),
  facebook: z.url("URL e pavlefshme").optional().or(z.literal("")),
});

/**
 * Optional partnership code redeemed at club creation. Shape only — whether
 * the code actually exists (and is still redeemable) is decided server-side,
 * and an invalid one warns rather than blocking creation.
 */
export const inviteCodeFieldSchema = z
  .string()
  .trim()
  .max(50, "Maksimumi 50 karaktere")
  .optional()
  .or(z.literal(""));

export const createClubSchema = clubBasicInfoSchema
  .extend(clubContactSchema.shape)
  .extend({ inviteCode: inviteCodeFieldSchema });

export type ClubBasicInfo = z.infer<typeof clubBasicInfoSchema>;
export type ClubContact = z.infer<typeof clubContactSchema>;
export type CreateClubInput = z.infer<typeof createClubSchema>;
