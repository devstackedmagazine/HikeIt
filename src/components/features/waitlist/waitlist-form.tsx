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
      <div className="flex items-center justify-center gap-2.5 border border-moss/40 bg-moss/[0.12] px-5 py-4 text-moss">
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
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email adresa juaj..."
          aria-label="Email"
          className="h-[54px] flex-1 border border-summit/20 bg-abyss px-5 text-sm text-summit placeholder:text-summit/35 focus:border-moss/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex h-[54px] shrink-0 items-center gap-2 border border-moss/40 bg-moss/20 px-7 text-xs font-bold tracking-[0.1em] text-moss uppercase transition-colors hover:bg-moss/35 disabled:opacity-50"
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
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
