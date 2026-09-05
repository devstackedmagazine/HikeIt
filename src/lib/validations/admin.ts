import { z } from "zod";

import { DEFAULT_COMMISSION_RATE } from "@/lib/commission";

/** The rate is entered as a percentage in the UI and stored as a decimal. */
const MAX_PERCENT = DEFAULT_COMMISSION_RATE * 100;

const percentField = z
  .number({ error: "Shkruani një numër" })
  .min(0, "Nuk mund të jetë negativ")
  .max(MAX_PERCENT, `Maksimumi ${String(MAX_PERCENT)}%`);

/** Super admin: set a club's commission override. */
export const setCommissionSchema = z.object({
  organizationId: z.uuid(),
  /** 0–2.5, converted to a 0–0.025 decimal server-side. */
  ratePercent: percentField,
  /** ISO date string; null/omitted = permanent grant. */
  until: z.iso.datetime({ offset: true }).nullish(),
  note: z.string().trim().max(500, "Maksimumi 500 karaktere").optional(),
});

export type SetCommissionInput = z.infer<typeof setCommissionSchema>;

/** Super admin: create an invite code. */
export const createInviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Të paktën 4 karaktere")
    .max(50, "Maksimumi 50 karaktere")
    .regex(/^[A-Za-z0-9-]+$/, "Vetëm shkronja, numra dhe viza"),
  ratePercent: percentField,
  /** null = the granted rate is permanent. */
  durationMonths: z
    .number()
    .int("Vetëm numra të plotë")
    .min(1, "Të paktën 1 muaj")
    .max(120, "Maksimumi 120 muaj")
    .nullish(),
  /** null = unlimited redemptions. */
  maxUses: z
    .number()
    .int("Vetëm numra të plotë")
    .min(1, "Të paktën 1 përdorim")
    .max(10000, "Maksimumi 10000")
    .nullish(),
  /** ISO date string; null = the code itself never expires. */
  expiresAt: z.iso.datetime({ offset: true }).nullish(),
});

export type CreateInviteCodeInput = z.infer<typeof createInviteCodeSchema>;

/** Percentage (0–2.5) → decimal rate (0–0.025), rounded to 4 dp. */
export function percentToRate(percent: number): number {
  return Math.round((percent / 100) * 10000) / 10000;
}
