"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Globe, Loader2, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { signUp } from "@/lib/auth/client";
import { cn } from "@/lib/utils/cn";
import { type RegisterInput, registerSchema } from "@/lib/validations/auth";

const LEFT_FEATURES = [
  "Zbulimi i shtigjeve",
  "Anëtarësimi në klube",
  "Statistikat e ngjitjeve",
];

/** 0–4 password strength score for the 4-segment meter. */
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
  "mb-1.5 block text-[10px] font-bold tracking-[0.12em] text-forest/50 uppercase";
const INPUT =
  "h-12 md:h-10 w-full border-[1.5px] border-forest/20 bg-summit px-4 text-[14px] text-forest placeholder:text-forest/25 placeholder:italic focus:border-forest focus:outline-none";

export default function RegisterPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { register, handleSubmit, formState } = form;
  const errors = formState.errors;

  const password = useWatch({ control: form.control, name: "password" });
  const strengthScore = scorePassword(password);

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    if (!acceptedTerms) {
      setFormError("Ju lutem pranoni Kushtet e Përdorimit.");
      return;
    }
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (error) {
      setFormError(error.message ?? "Nuk mundëm të krijojmë llogarinë.");
      return;
    }
    setSubmittedEmail(values.email);
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

        <p className="font-heading relative z-10 text-[18px] font-extrabold text-summit uppercase">
          HikeIt
        </p>

        <div className="relative z-10">
          <h2 className="font-heading text-[clamp(40px,6vw,72px)] leading-[0.92] font-extrabold tracking-[-0.04em] text-summit uppercase">
            Fillo
            <br />
            Udhëtimin
            <br />
            Tënd
          </h2>
          <ul className="mt-8 space-y-3">
            {LEFT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex size-4 shrink-0 items-center justify-center border-[1.5px] border-moss">
                  <Check className="size-3 text-moss" strokeWidth={3} />
                </span>
                <span className="text-[12px] font-bold tracking-[0.08em] text-summit/75 uppercase">
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full flex-col justify-center bg-summit px-6 py-10 md:w-[55%] md:px-16 md:py-7">
        <p className="font-heading mb-8 text-[18px] font-extrabold text-forest uppercase md:hidden">
          HikeIt
        </p>

        <div className="w-full max-w-[440px]">
          {submittedEmail ? (
            <div className="border-[1.5px] border-moss/40 bg-moss/[0.08] p-6">
              <p className="font-heading mb-2 text-lg font-extrabold text-forest uppercase">
                Llogaria u krijua!
              </p>
              <p className="text-sm leading-[1.6] text-forest/60">
                Kemi dërguar email verifikimi në{" "}
                <span className="font-semibold text-forest">
                  {submittedEmail}
                </span>
                . Kliko lidhjen për të aktivizuar llogarinë.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-[clamp(28px,4vw,40px)] leading-none font-extrabold tracking-[-0.03em] text-forest uppercase">
                Regjistrohu
              </h1>
              <p className="mt-3 mb-8 text-[14px] leading-[1.5] text-forest/55 md:mt-2 md:mb-4">
                Krijo llogarinë tënde në ekosistemin më të madh të shtigjeve në
                Ballkan.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 md:space-y-2.5"
              >
                <div>
                  <label className={LABEL}>Emri dhe mbiemri</label>
                  <input
                    className={INPUT}
                    placeholder="Shkruaj emrin tënd..."
                    autoComplete="name"
                    {...register("name")}
                  />
                  {errors.name ? (
                    <p className="mt-1 text-xs text-danger">
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
                    <p className="mt-1 text-xs text-danger">
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
                      aria-label="Shfaq fjalëkalimin"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-forest/40 hover:text-forest"
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
                    <p className="mt-1 text-xs text-danger">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className={LABEL}>Konfirmo fjalëkalimin</label>
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
                      aria-label="Shfaq konfirmimin"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-forest/40 hover:text-forest"
                    >
                      {showConfirm ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword ? (
                    <p className="mt-1 text-xs text-danger">
                      {errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>

                <label className="flex items-center gap-2.5 text-[13px] text-forest/70">
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
                      <Check className="size-3 text-summit" strokeWidth={3} />
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
                  <p className="text-sm text-danger">{formError}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={formState.isSubmitting}
                  className="font-heading flex h-13 w-full items-center justify-center gap-2 bg-forest text-[14px] font-extrabold tracking-[0.04em] text-summit uppercase transition-colors hover:bg-abyss disabled:opacity-50 md:h-11"
                >
                  {formState.isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Regjistrohu →
                </button>
              </form>

              <div className="mt-6 border-t border-forest/10 pt-5 md:mt-3 md:pt-4">
                <p className="text-center text-[13px] text-forest/55">
                  Keni llogari?{" "}
                  <Link href="/login" className="font-bold text-forest">
                    KYÇU
                  </Link>
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <span className="flex size-9 items-center justify-center border border-forest/20 text-forest/50">
                    <Globe className="size-4" />
                  </span>
                  <span className="flex size-9 items-center justify-center border border-forest/20 text-forest/50">
                    <Share2 className="size-4" />
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
