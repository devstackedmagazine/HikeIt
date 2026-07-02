"use client";

import { AlertTriangle } from "lucide-react";
import { useState, useTransition } from "react";

import { deleteAccount } from "@/server/actions/profile";

export function DeleteAccountButton({ email }: { email: string }) {
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const matches = value.trim().toLowerCase() === email.toLowerCase();

  return (
    <div className="border border-danger/20 bg-danger/[0.08] p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <AlertTriangle className="size-3.5 text-danger" />
        <span className="text-[11px] font-bold tracking-[0.06em] text-danger uppercase">
          Zona e rrezikut
        </span>
      </div>
      <p className="mb-3 text-[11px] leading-[1.55] text-summit/40">
        Fshirja e llogarisë është e përhershme. Të gjitha të dhënat dhe historiku
        do të humbasin.
      </p>

      {confirming ? (
        <div className="space-y-2">
          <input
            type="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={email}
            aria-label="Konfirmo emailin"
            className="h-9 w-full border border-danger/30 bg-abyss px-3 text-[11px] text-summit placeholder:text-summit/25 focus:border-danger focus:outline-none"
          />
          <button
            type="button"
            disabled={!matches || pending}
            onClick={() => startTransition(() => void deleteAccount(value))}
            className="w-full bg-danger py-2.5 text-[11px] font-extrabold tracking-[0.08em] text-summit uppercase transition-colors hover:bg-red-900 disabled:opacity-40"
          >
            {pending ? "Duke fshirë…" : "Konfirmo fshirjen"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full bg-danger py-2.5 text-[11px] font-extrabold tracking-[0.08em] text-summit uppercase transition-colors hover:bg-red-900"
        >
          Fshi llogarinë
        </button>
      )}
    </div>
  );
}
