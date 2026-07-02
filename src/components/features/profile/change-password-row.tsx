"use client";

import { Loader2, Lock } from "lucide-react";
import { useState } from "react";

import { changePassword } from "@/server/actions/profile";

export function ChangePasswordRow() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "h-9 w-full border border-summit/12 bg-abyss px-3 text-[11px] text-summit placeholder:text-summit/25 focus:border-moss/50 focus:outline-none";

  async function submit() {
    setError(null);
    setStatus("loading");
    const result = await changePassword({
      currentPassword: current,
      newPassword: next,
    });
    if (!result.success) {
      setStatus("idle");
      setError(result.error ?? "Diçka shkoi keq.");
      return;
    }
    setStatus("done");
    setCurrent("");
    setNext("");
  }

  return (
    <div className="border-b border-summit/[0.06] pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-[11px] font-semibold tracking-[0.06em] text-summit/60 uppercase transition-colors hover:text-summit/90"
      >
        Ndrysho fjalëkalimin
        <Lock className="size-3.5 text-summit/30" />
      </button>

      {open ? (
        <div className="mt-3 space-y-2">
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Fjalëkalimi aktual"
            className={inputClass}
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Fjalëkalimi i ri (10+ karaktere)"
            className={inputClass}
          />
          {error ? <p className="text-[10px] text-danger">{error}</p> : null}
          {status === "done" ? (
            <p className="text-[10px] text-moss">Fjalëkalimi u ndryshua.</p>
          ) : null}
          <button
            type="button"
            disabled={status === "loading" || !current || next.length < 10}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 border border-moss/40 bg-moss/20 py-2 text-[10px] font-bold tracking-[0.08em] text-moss uppercase transition-colors hover:bg-moss/30 disabled:opacity-40"
          >
            {status === "loading" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            Ruaj
          </button>
        </div>
      ) : null}
    </div>
  );
}
