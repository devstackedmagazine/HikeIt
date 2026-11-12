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
  name: z
    .string()
    .trim()
    .min(3, "Të paktën 3 karaktere")
    .max(100, "Maksimumi 100 karaktere"),
  slug: z
    .string()
    .trim()
    .min(3, "Të paktën 3 karaktere")
    .max(100, "Maksimumi 100 karaktere")
    .regex(/^[a-z0-9-]+$/, "Vetëm shkronja të vogla, numra dhe viza"),
  description: z
    .string()
    .trim()
    .min(50, "Të paktën 50 karaktere")
    .max(1000, "Maksimumi 1000 karaktere"),
  city: z.string().min(1, "Zgjidhni një qytet"),
  foundedYear: z
    .number({ error: "Shkruani vitin, p.sh. 1998." })
    .int("Shkruani vitin, p.sh. 1998.")
    .min(1900, "Viti duhet të jetë pas 1900.")
    .max(currentYear, "Viti nuk mund të jetë në të ardhmen.")
    .optional(),
});

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Most people type "klubi.com" or "www.facebook.com/klubi", not the scheme.
 * Add https:// when none was given and upgrade http://, so that isn't an
 * error; any other scheme is left as typed and fails the https check below.
 */
function withHttps(value: string): string {
  const v = value.trim();
  if (!v) return v;
  if (/^http:\/\//i.test(v)) return `https://${v.slice(7)}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  return `https://${v}`;
}

/** Rendered as links on the public club page, so https only. */
const httpsUrl = z
  .string()
  .trim()
  .max(200, "Maksimumi 200 karaktere")
  .transform(withHttps)
  .refine(
    (v) => parseUrl(v)?.protocol === "https:",
    "Shkruani një adresë të vlefshme, p.sh. klubi.com",
  );

const facebookUrl = httpsUrl.refine((v) => {
  const host = parseUrl(v)?.hostname ?? "";
  return host === "facebook.com" || host.endsWith(".facebook.com");
}, "Duhet të jetë një lidhje facebook.com, p.sh. facebook.com/klubi");

export const clubContactSchema = z.object({
  website: httpsUrl.optional().or(z.literal("")),
  instagram: z
    .string()
    .trim()
    .max(50, "Maksimumi 50 karaktere")
    // The label says "pa @", but people type it anyway.
    .transform((v) => v.replace(/^@+/, ""))
    .optional()
    .or(z.literal("")),
  facebook: facebookUrl.optional().or(z.literal("")),
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

/** Redeeming a code from club settings, after creation — unlike the field
 * above, a code is required here since submitting the form is the whole point. */
export const redeemInviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Shkruani një kod")
    .max(50, "Maksimumi 50 karaktere"),
});

export type RedeemInviteCodeInput = z.infer<typeof redeemInviteCodeSchema>;

export type ClubBasicInfo = z.infer<typeof clubBasicInfoSchema>;
export type ClubContact = z.infer<typeof clubContactSchema>;
export type CreateClubInput = z.infer<typeof createClubSchema>;
