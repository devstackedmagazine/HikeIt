"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import { signIn } from "@/lib/auth/client";
import { cn } from "@/lib/utils/cn";
import { type LoginInput, loginSchema } from "@/lib/validations/auth";

const LEFT_FEATURES = [
  "Gjej shtigje të verifikuara",
  "Bashkohu me udhëtime",
  "Merr alerts moti",
];

const LABEL =
  "mb-1.5 block text-[10px] font-bold tracking-[0.12em] text-forest/50 uppercase";
const INPUT =
  "h-10 w-full border-[1.5px] border-forest/20 bg-summit px-3.5 text-[13px] text-forest placeholder:text-forest/25 placeholder:italic focus:border-forest focus:outline-none";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const [formError, setFormError] = useState<{
    message: string;
    tone: "error" | "warning";
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [socialNote, setSocialNote] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { register, handleSubmit, formState } = form;
  const errors = formState.errors;

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setFormError({
          message: "Ju lutem verifikoni emailin tuaj para se të kyçeni.",
          tone: "warning",
        });
      } else {
        setFormError({
          message: "Email ose fjalëkalim i gabuar.",
          tone: "error",
        });
      }
      return;
    }

    router.push(redirectTo);
    router.refresh();
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
        {/* Prominent geometric mountain from /public/auth/loginGeos.svg */}
        <div className="pointer-events-none absolute inset-0 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/auth/loginGeos.svg"
            alt=""
            aria-hidden
            className="h-full w-full object-contain"
            style={{ opacity: 0.9 }}
          />
        </div>

        <p className="font-heading relative z-10 text-[18px] font-extrabold text-summit uppercase">
          HikeIt
        </p>

        <div className="relative z-10">
          <h2 className="font-heading mb-5 text-[clamp(24px,4vw,44px)] leading-[1.0] font-extrabold tracking-[-0.03em] text-summit uppercase">
            Mirë se vini përsëri
          </h2>
          <ul className="space-y-3">
            {LEFT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex size-[18px] shrink-0 items-center justify-center border-[1.5px] border-moss">
                  <Check className="size-2.5 text-moss" strokeWidth={3} />
                </span>
                <span className="text-[11px] font-bold tracking-[0.08em] text-summit/75 uppercase">
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full flex-col justify-center bg-summit px-6 py-10 md:w-[55%] md:px-16">
        <p className="font-heading mb-8 text-[18px] font-extrabold text-forest uppercase md:hidden">
          HikeIt
        </p>

        <div className="w-full max-w-[440px]">
          <h1 className="font-heading text-[clamp(32px,5vw,56px)] leading-none font-extrabold tracking-[-0.03em] text-forest uppercase">
            Kyçu
          </h1>
          <p className="mt-1.5 mb-7 text-[14px] leading-[1.5] text-forest/50">
            Mirë se vini përsëri në HikeIt
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3.5">
              <label className={LABEL}>Email</label>
              <input
                className={INPUT}
                type="email"
                placeholder="emri@shembull.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-danger">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between">
                <label className={LABEL.replace("mb-1.5 ", "")}>
                  Fjalëkalimi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-semibold tracking-[0.06em] text-forest/50 uppercase transition-colors hover:text-forest"
                >
                  Harruat fjalëkalimin?
                </Link>
              </div>
              <div className="relative">
                <input
                  className={cn(INPUT, "pr-11")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Shfaq fjalëkalimin"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-forest/35 hover:text-forest/60"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs text-danger">
                  {errors.password.message}
                </p>
              ) : null}
              {formError ? (
                <p
                  className={cn(
                    "mt-1.5 text-[11px]",
                    formError.tone === "warning" ? "text-alert" : "text-danger",
                  )}
                >
                  {formError.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={formState.isSubmitting}
              className="font-heading mb-5 flex h-11 w-full items-center justify-center gap-2 bg-forest text-[14px] font-extrabold tracking-[0.04em] text-summit uppercase transition-colors hover:bg-abyss disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Duke u kyçur...
                </>
              ) : (
                "Kyçu →"
              )}
            </button>
          </form>

          <div className="relative mb-4 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-forest/12" />
            <span className="relative bg-summit px-3 text-[11px] font-medium tracking-[0.1em] text-forest/35 uppercase">
              Ose
            </span>
          </div>

          <div className="mb-5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setSocialNote("Së shpejti disponueshëm.")}
              className="h-10 flex-1 border-[1.5px] border-forest/20 text-[11px] font-bold tracking-[0.08em] text-forest/60 uppercase transition-colors hover:border-forest/40 hover:text-forest"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setSocialNote("Së shpejti disponueshëm.")}
              className="h-10 flex-1 border-[1.5px] border-forest/20 text-[11px] font-bold tracking-[0.08em] text-forest/60 uppercase transition-colors hover:border-forest/40 hover:text-forest"
            >
              Apple
            </button>
          </div>
          {socialNote ? (
            <p className="-mt-3 mb-5 text-center text-[11px] text-forest/40">
              {socialNote}
            </p>
          ) : null}

          <p className="text-center text-[13px] text-forest/50">
            Nuk keni llogari?{" "}
            <Link
              href="/register"
              className="font-bold text-forest uppercase transition-colors hover:text-moss"
            >
              Regjistrohu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
