import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.email("Shkruani një email të vlefshëm"),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
