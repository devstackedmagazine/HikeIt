import { Ban } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getSocialErrorCopy, providerLabel } from "@/lib/auth/social-errors";

export const metadata: Metadata = { title: "Kyçja dështoi" };

export default async function SocialLoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; provider?: string }>;
}) {
  const { error, provider } = await searchParams;
  const { title, message } = getSocialErrorCopy(error);
  const provider_ = providerLabel(provider);

  return (
    <main className="bg-summit flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="border-forest/20 w-full max-w-md border-[1.5px] p-8 text-center">
        <span className="border-danger/40 bg-danger/10 mx-auto mb-5 flex size-12 items-center justify-center border-[1.5px]">
          <Ban className="text-danger size-5" />
        </span>

        <h1 className="font-heading text-forest mb-3 text-[clamp(20px,3vw,28px)] leading-none font-extrabold tracking-[-0.02em] uppercase">
          {title}
        </h1>

        {provider_ ? (
          <p className="text-forest/40 mb-2 text-[11px] font-bold tracking-[0.08em] uppercase">
            Përpjekje me {provider_}
          </p>
        ) : null}

        <p className="text-forest/60 mb-7 text-[14px] leading-[1.6]">
          {message}
        </p>

        <Link
          href="/login"
          className="font-heading bg-forest text-summit hover:bg-abyss flex h-11 w-full items-center justify-center text-[14px] font-extrabold tracking-[0.04em] uppercase transition-colors"
        >
          Kthehu te Kyçu →
        </Link>
      </div>
    </main>
  );
}
