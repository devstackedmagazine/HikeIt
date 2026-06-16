"use client";

import { CheckCircle, Loader2, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="flex items-center justify-center gap-2 rounded-lg bg-primary-foreground/10 px-4 py-3 text-primary-foreground">
        <CheckCircle className="size-5 shrink-0" />
        <span className="font-medium">
          Faleminderit! Do të njoftohesh kur hapim.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@shembull.com"
          aria-label="Email"
          className="h-11 bg-background pl-9 text-foreground"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        variant="secondary"
        className="h-11 shrink-0"
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="animate-spin" />
            Duke dërguar…
          </>
        ) : (
          "Merr akses të hershëm"
        )}
      </Button>
      {error ? (
        <p className="text-sm text-primary-foreground/90 sm:hidden">{error}</p>
      ) : null}
    </form>
  );
}
