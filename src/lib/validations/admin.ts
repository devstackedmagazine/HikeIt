import { z } from "zod";

/** Months of trial, shared by the extend-trial dialog and invite codes. */
const trialMonthsField = z
  .number({ error: "Shkruani një numër" })
  .int("Vetëm numra të plotë")
  .min(1, "Të paktën 1 muaj")
  .max(120, "Maksimumi 120 muaj");

/** Super admin: extend a club's free trial. */
export const extendTrialSchema = z.object({
  organizationId: z.uuid(),
  /** Months added on top of the trial already running (or from today). */
  months: trialMonthsField,
  /** Why the grant exists. Recorded in `audit_logs` only. */
  note: z.string().trim().max(500, "Maksimumi 500 karaktere").optional(),
});

export type ExtendTrialInput = z.infer<typeof extendTrialSchema>;

/** Super admin: create an invite code. */
export const createInviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Të paktën 4 karaktere")
    .max(50, "Maksimumi 50 karaktere")
    .regex(/^[A-Za-z0-9-]+$/, "Vetëm shkronja, numra dhe viza"),
  /** Months of Pro access the code grants, replacing the standard trial. */
  trialMonths: trialMonthsField,
  /**
   * Paddle discount applied if the club later subscribes. Optional — a code
   * may grant free runway only. Not validated against Paddle here: a typo
   * surfaces at checkout, and blocking code creation on a live API call would
   * make the admin panel depend on Paddle being reachable.
   */
  paddleDiscountId: z
    .string()
    .trim()
    .max(100, "Maksimumi 100 karaktere")
    .optional(),
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
