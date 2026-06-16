import { z } from "zod";

export const CONDITION_OPTIONS = [
  "excellent",
  "good",
  "fair",
  "poor",
  "closed",
] as const;

export const conditionLabels: Record<string, string> = {
  excellent: "Shkëlqyeshëm",
  good: "Mirë",
  fair: "Mesatar",
  poor: "Dobët",
  closed: "I mbyllur",
};

export const submitReviewSchema = z.object({
  trailId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  conditionReport: z.enum(CONDITION_OPTIONS).optional(),
  // HTML date input value (YYYY-MM-DD).
  hikedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
