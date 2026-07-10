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

  async function handleGoogleSignIn() {
    await signIn.social({ provider: "google", callbackURL: redirectTo });
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

        <Link
          href="/"
          className="font-heading text-summit relative z-10 text-[18px] font-extrabold uppercase"
        >
          HikeIt
        </Link>

        <div className="relative z-10">
          <h2 className="font-heading text-summit mb-5 text-[clamp(24px,4vw,44px)] leading-[1.0] font-extrabold tracking-[-0.03em] uppercase">
            Mirë se vini përsëri
          </h2>
          <ul className="space-y-3">
            {LEFT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="border-moss flex size-[18px] shrink-0 items-center justify-center border-[1.5px]">
                  <Check className="text-moss size-2.5" strokeWidth={3} />
                </span>
                <span className="text-summit/75 text-[11px] font-bold tracking-[0.08em] uppercase">
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-summit flex w-full flex-col justify-center px-6 py-10 md:w-[55%] md:px-16">
        <p className="font-heading text-forest mb-8 text-[18px] font-extrabold uppercase md:hidden">
          HikeIt
        </p>

        <div className="w-full max-w-[440px]">
          <h1 className="font-heading text-forest text-[clamp(32px,5vw,56px)] leading-none font-extrabold tracking-[-0.03em] uppercase">
            Kyçu
          </h1>
          <p className="text-forest/50 mt-1.5 mb-7 text-[14px] leading-[1.5]">
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
                <p className="text-danger mt-1 text-xs">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between">
                <label className={LABEL.replace("mb-1.5", "")}>
                  Fjalëkalimi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-forest/50 hover:text-forest text-[10px] font-semibold tracking-[0.06em] uppercase transition-colors"
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
                  className="text-forest/35 hover:text-forest/60 absolute top-1/2 right-3 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="text-danger mt-1 text-xs">
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
              className="font-heading bg-forest text-summit hover:bg-abyss mb-5 flex h-11 w-full items-center justify-center gap-2 text-[14px] font-extrabold tracking-[0.04em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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
            <span className="bg-forest/12 absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
            <span className="bg-summit text-forest/35 relative px-3 text-[11px] font-medium tracking-[0.1em] uppercase">
              Ose
            </span>
          </div>

          <div className="mb-5 flex gap-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="border-forest/20 text-forest/60 hover:border-forest/40 hover:text-forest h-10 flex-1 border-[1.5px] text-[11px] font-bold tracking-[0.08em] uppercase transition-colors"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setSocialNote("Së shpejti disponueshëm.")}
              className="border-forest/20 text-forest/60 hover:border-forest/40 hover:text-forest h-10 flex-1 border-[1.5px] text-[11px] font-bold tracking-[0.08em] uppercase transition-colors"
            >
              Apple
            </button>
          </div>
          {socialNote ? (
            <p className="text-forest/40 -mt-3 mb-5 text-center text-[11px]">
              {socialNote}
            </p>
          ) : null}

          <p className="text-forest/50 text-center text-[13px]">
            Nuk keni llogari?{" "}
            <Link
              href="/register"
              className="text-forest hover:text-moss font-bold uppercase transition-colors"
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
