import { z } from "zod";

/**
 * Auth form schemas, shared between client (react-hook-form resolver) and any
 * server-side validation. Password policy: at least 10 characters, with at
 * least one letter and one number.
 */
const passwordSchema = z
  .string()
  .min(10, "Fjalëkalimi duhet të ketë të paktën 10 karaktere.")
  .regex(/[A-Za-z]/, "Fjalëkalimi duhet të përmbajë të paktën një shkronjë.")
  .regex(/[0-9]/, "Fjalëkalimi duhet të përmbajë të paktën një numër.");

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Emri duhet të ketë të paktën 2 shkronja.")
      .max(100, "Emri mund të ketë më së shumti 100 shkronja."),
    email: z.email("Shkruani një adresë email të vlefshme."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Fjalëkalimet nuk përputhen.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Shkruani një adresë email të vlefshme."),
  password: z.string().min(1, "Shkruani fjalëkalimin."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Shkruani një adresë email të vlefshme."),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Fjalëkalimet nuk përputhen.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
