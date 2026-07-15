"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { joinWaitlist } from "@/server/actions/waitlist";

export function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const result = await joinWaitlist(email, source);
    if (result.success) {
      setStatus("success");
    } else {
      setStatus("idle");
      setError(result.error ?? "Diçka shkoi keq.");
    }
  }

  if (status === "success") {
    return (
      <div className="border-moss/40 bg-moss/[0.12] text-moss flex items-center justify-center gap-2.5 border px-5 py-4">
        <CheckCircle2 className="size-5 shrink-0" />
        <span className="text-sm font-semibold">
          Faleminderit! Do të njoftoheni kur hapim.
        </span>
      </div>
    );
  }

  return (
    <div className="text-left">
      {/* Input and button are flush — no gap between them. */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email adresa juaj..."
          aria-label="Email"
          className="border-summit/20 bg-abyss text-summit placeholder:text-summit/35 focus:border-moss/50 !h-[54px] min-w-0 border px-5 text-sm focus:outline-none sm:flex-1"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="border-moss/40 bg-moss/20 text-moss hover:bg-moss/35 flex h-[54px] w-full shrink-0 items-center justify-center gap-2 border px-7 text-xs font-bold tracking-[0.1em] uppercase transition-colors disabled:opacity-50 sm:w-auto"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Duke dërguar…
            </>
          ) : (
            "Merr Akses →"
          )}
        </button>
      </form>
      {error ? (
        <p className="text-danger mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
