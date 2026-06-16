export type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Lightweight password strength estimate for the signup UI (not a security
 * control — the real policy lives in `registerSchema`). Scores length and
 * character-class variety into weak / medium / strong.
 */
export function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}
