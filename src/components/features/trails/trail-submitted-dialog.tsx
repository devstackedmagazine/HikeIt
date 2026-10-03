"use client";

import { CheckCircle2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmation after a trail proposal (`/trails?submitted=1`). Closing it
 * drops the param, so a refresh or a shared link doesn't show it again.
 */
export function TrailSubmittedDialog({
  initialOpen,
}: {
  initialOpen: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(initialOpen);

  function close() {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("submitted");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    >
      <DialogContent className="bg-abyss border-moss text-summit rounded-none border-2 p-6 ring-0">
        <CheckCircle2 className="text-moss size-8" />
        <DialogTitle className="font-heading text-summit text-xl font-extrabold tracking-[-0.02em] uppercase">
          Shtegu u dërgua për shqyrtim
        </DialogTitle>
        <DialogDescription className="text-summit/80 text-sm leading-[1.6]">
          Ekipi i HikeIt do ta shqyrtojë. Deri atëherë e sheh vetëm ti; pas
          miratimit shfaqet në listën e shtigjeve.
        </DialogDescription>
        <button
          type="button"
          onClick={close}
          className="bg-moss text-abyss hover:bg-sage w-full px-5 py-3 text-xs font-extrabold tracking-[0.08em] uppercase transition-colors"
        >
          Në rregull
        </button>
      </DialogContent>
    </Dialog>
  );
}
