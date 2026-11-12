"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  InAppBrowserNotice,
  useInAppBrowser,
} from "@/components/features/auth/in-app-browser-notice";
import { signIn, signUp } from "@/lib/auth/client";
import { cn } from "@/lib/utils/cn";
import { type RegisterInput, registerSchema } from "@/lib/validations/auth";

const LEFT_FEATURES = [
  "Zbulimi i shtigjeve",
  "Anëtarësimi në klube",
  "Statistikat e ngjitjeve",
];

/** 0–4 password strength score for the 4-segment meter. */
/**
 * Albanian message for a failed email sign-up. Better Auth's own messages are
 * English, so they're never shown directly.
 */
function registerErrorMessage(code: string | undefined): string {
  switch (code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Ekziston tashmë një llogari me këtë email. Provoni të hyni, ose përdorni “Keni harruar fjalëkalimin?”.";
    case "INVALID_EMAIL":
      return "Adresa email nuk është e vlefshme.";
    case "PASSWORD_TOO_SHORT":
      return "Fjalëkalimi duhet të ketë të paktën 10 karaktere.";
    case "PASSWORD_TOO_LONG":
      return "Fjalëkalimi është shumë i gjatë.";
    default:
      return "Nuk mundëm ta krijojmë llogarinë. Ju lutemi provoni sërish.";
  }
}

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

function strengthColor(score: number): string {
  if (score <= 2) return "bg-danger";
  if (score === 3) return "bg-alert";
  return "bg-moss";
}

const LABEL =
  "mb-1.5 block text-[10px] font-bold tracking-[0.12em] text-forest/70 uppercase";
const INPUT =
  "h-12 md:h-10 w-full border-[1.5px] border-forest/60 bg-summit px-4 text-[14px] text-forest placeholder:text-forest/70 placeholder:italic focus:border-forest focus:outline-none";

export default function RegisterPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [socialFailed, setSocialFailed] = useState(false);
  const inAppBrowser = useInAppBrowser();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { register, handleSubmit, formState } = form;
  const errors = formState.errors;

  const password = useWatch({ control: form.control, name: "password" });
  const strengthScore = scorePassword(password);

  /** Both boxes are required for every sign-up method; null when ticked. */
  function consentError(): string | null {
    if (!confirmedAge) {
      return "Ju lutem konfirmoni që jeni 18 vjeç ose më shumë.";
    }
    if (!acceptedTerms) return "Ju lutem pranoni Kushtet e Përdorimit.";
    return null;
  }

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    const consent = consentError();
    if (consent) {
      setFormError(consent);
      return;
    }
    // `ageConfirmed` is required server-side (databaseHooks in lib/auth).
    // It isn't a user field, so it's absent from the client's body type;
    // the endpoint accepts and ignores extra keys.
    const body = {
      name: values.name,
      email: values.email,
      password: values.password,
      ageConfirmed: true,
    };
    const { error } = await signUp.email(body);
    if (error) {
      setFormError(registerErrorMessage(error.code));
      return;
    }
    setSubmittedEmail(values.email);
  }

  // New social users go through onboarding to pick hiker vs club, same as
  // the email registration flow. Social sign-up is explicit (`requestSignUp`)
  // and carries the 18+ confirmation through the OAuth state, where the
  // server checks it before creating the account.
  async function handleSocialSignUp(provider: "google" | "facebook") {
    setFormError(null);
    const consent = consentError();
    if (consent) {
      setFormError(consent);
      return;
    }
    // A failed request (typically inside an in-app browser) shows the
    // open-in-browser notice instead of an unhandled rejection.
    try {
      const { error } = await signIn.social({
        provider,
        callbackURL: "/onboarding",
        errorCallbackURL: `/social-login-error?provider=${provider}`,
        requestSignUp: true,
        additionalData: { ageConfirmed: true },
      });
      if (error) setSocialFailed(true);
    } catch {
      setSocialFailed(true);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* LEFT PANEL */}
      <div
        className="relative hidden w-[45%] flex-col justify-between overflow-hidden p-10 md:flex"
        style={{
          background:
            "linear-gradient(180deg, #0D1F14 0%, #1A3D2B 60%, #2D5F3F 100%)",
        }}
      >
        {/* Geometric mountains from /public/auth/registerGeos.svg */}
        <div className="pointer-events-none absolute inset-0 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/auth/registerGeos.svg"
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            style={{ opacity: 0.18 }}
          />
        </div>

        <Link
          href="/"
          className="font-heading text-summit relative z-10 flex items-center gap-2 text-[18px] font-extrabold uppercase"
        >
          <Image
            src="/logos/Hikeit-pfp.png"
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
          HikeIt
        </Link>

        <div className="relative z-10">
          <h2 className="font-heading text-summit text-[clamp(40px,6vw,72px)] leading-[1.2] font-extrabold tracking-[-0.04em] uppercase">
            Filloni
            <br />
            Udhëtimin
            <br />
            Tuaj
          </h2>
          <ul className="mt-8 space-y-3">
            {LEFT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="border-moss flex size-4 shrink-0 items-center justify-center border-[1.5px]">
                  <Check className="text-moss size-3" strokeWidth={3} />
                </span>
                <span className="text-summit/75 text-[12px] font-bold tracking-[0.08em] uppercase">
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-summit flex w-full flex-col justify-center px-6 py-10 md:w-[55%] md:px-16 md:py-7">
        <p className="font-heading text-forest mb-8 flex items-center gap-2 text-[18px] font-extrabold uppercase md:hidden">
          <Image
            src="/logos/Hikeit-pfp.png"
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
          HikeIt
        </p>

        <div className="w-full max-w-[440px]">
          {submittedEmail ? (
            <div className="border-moss/40 bg-moss/[0.08] border-[1.5px] p-6">
              <p className="font-heading text-forest mb-2 text-lg font-extrabold uppercase">
                Llogaria u krijua!
              </p>
              <p className="text-forest/70 text-sm leading-[1.6]">
                Kemi dërguar email verifikimi në{" "}
                <span className="text-forest font-semibold">
                  {submittedEmail}
                </span>
                . Klikoni linkun në email për të aktivizuar llogarinë.
              </p>
              <p className="text-forest/70 mt-3 text-xs leading-[1.6]">
                Nuk ju erdhi? Kontrolloni dosjen e spam-it, ose{" "}
                <Link href="/login" className="text-forest underline">
                  provoni të hyni
                </Link>{" "}
                — do t&apos;ju dërgojmë një link të ri.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-forest text-[clamp(28px,4vw,40px)] leading-[1.2] font-extrabold tracking-[-0.03em] uppercase">
                Regjistrohuni
              </h1>
              <p className="text-forest/70 mt-3 mb-8 text-[14px] leading-[1.5] md:mt-2 md:mb-4">
                Krijoni llogarinë tuaj për të gjetur shtigje dhe udhëtime me
                klubet e alpinizmit në Kosovë.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 md:space-y-2.5"
              >
                <div>
                  <label className={LABEL}>Emri dhe mbiemri</label>
                  <input
                    className={INPUT}
                    placeholder="Emri dhe mbiemri juaj"
                    autoComplete="name"
                    {...register("name")}
                  />
                  {errors.name ? (
                    <p className="text-danger mt-1 text-xs">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className={LABEL}>Email</label>
                  <input
                    className={INPUT}
                    type="email"
                    placeholder="adresa@email.com"
                    autoComplete="email"
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="text-danger mt-1 text-xs">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className={LABEL}>Fjalëkalimi</label>
                  <div className="relative">
                    <input
                      className={cn(INPUT, "pr-12")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label="Shfaqni fjalëkalimin"
                      className="text-forest/70 hover:text-forest absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {password ? (
                    <div className="mt-2 flex gap-[3px]">
                      {[1, 2, 3, 4].map((seg) => (
                        <span
                          key={seg}
                          className={cn(
                            "h-[3px] flex-1 transition-colors",
                            seg <= strengthScore
                              ? strengthColor(strengthScore)
                              : "bg-forest/10",
                          )}
                        />
                      ))}
                    </div>
                  ) : null}
                  {errors.password ? (
                    <p className="text-danger mt-1 text-xs">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className={LABEL}>Konfirmoni fjalëkalimin</label>
                  <div className="relative">
                    <input
                      className={cn(INPUT, "pr-12")}
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label="Shfaqni konfirmimin"
                      className="text-forest/70 hover:text-forest absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      {showConfirm ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword ? (
                    <p className="text-danger mt-1 text-xs">
                      {errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>

                <label className="text-forest/70 flex items-center gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    checked={confirmedAge}
                    onChange={(e) => setConfirmedAge(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center border-[1.5px]",
                      confirmedAge
                        ? "border-forest bg-forest"
                        : "border-forest/30",
                    )}
                  >
                    {confirmedAge ? (
                      <Check className="text-summit size-3" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span>Konfirmoj që jam 18 vjeç ose më shumë</span>
                </label>

                <label className="text-forest/70 flex items-center gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center border-[1.5px]",
                      acceptedTerms
                        ? "border-forest bg-forest"
                        : "border-forest/30",
                    )}
                  >
                    {acceptedTerms ? (
                      <Check className="text-summit size-3" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span>
                    Pranoj{" "}
                    <Link href="/terms" className="text-forest underline">
                      Kushtet e Përdorimit
                    </Link>
                  </span>
                </label>

                {formError ? (
                  <p className="text-danger text-sm">{formError}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={formState.isSubmitting}
                  className="font-heading bg-forest text-summit hover:bg-abyss flex h-13 w-full items-center justify-center gap-2 text-[14px] font-extrabold tracking-[0.04em] uppercase transition-colors disabled:opacity-50 md:h-11"
                >
                  {formState.isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Regjistrohuni →
                </button>
              </form>

              <div className="border-forest/10 mt-6 border-t pt-5 md:mt-3 md:pt-4">
                <p className="text-forest/70 text-center text-[13px]">
                  Keni llogari?{" "}
                  <Link href="/login" className="text-forest font-bold">
                    KYÇUNI
                  </Link>
                </p>
                {inAppBrowser || socialFailed ? (
                  <div className="mt-4">
                    <InAppBrowserNotice />
                  </div>
                ) : null}
                <div className="mt-4 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleSocialSignUp("google")}
                    className="border-forest/60 text-forest/70 hover:border-forest hover:text-forest h-10 flex-1 border-[1.5px] text-[11px] font-bold tracking-[0.08em] uppercase transition-colors"
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSocialSignUp("facebook")}
                    className="border-forest/60 text-forest/70 hover:border-forest hover:text-forest h-10 flex-1 border-[1.5px] text-[11px] font-bold tracking-[0.08em] uppercase transition-colors"
                  >
                    Facebook
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
