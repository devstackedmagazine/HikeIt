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
    "h-9 w-full border border-summit/40 bg-abyss px-3 text-[11px] text-summit placeholder:text-summit/70 focus:border-moss focus:outline-none";

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
    <div className="border-summit/[0.06] border-b pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-summit/60 hover:text-summit/90 flex w-full items-center justify-between text-[11px] font-semibold tracking-[0.06em] uppercase transition-colors"
      >
        Ndrysho fjalëkalimin
        <Lock className="text-summit/30 size-3.5" />
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
          {error ? <p className="text-danger text-[10px]">{error}</p> : null}
          {status === "done" ? (
            <p className="text-moss text-[10px]">Fjalëkalimi u ndryshua.</p>
          ) : null}
          <button
            type="button"
            disabled={status === "loading" || !current || next.length < 10}
            onClick={submit}
            className="border-moss/40 bg-moss/20 text-moss hover:bg-moss/30 flex w-full items-center justify-center gap-2 border py-2 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors disabled:opacity-40"
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
