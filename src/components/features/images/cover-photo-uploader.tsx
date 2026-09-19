"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Standalone cover-photo drop zone. Presentational for now: it previews the
 * chosen file locally but does not persist — the trip schema/action don't yet
 * accept a cover image. Wire to Cloudinary once `coverImage` lands on the form.
 */
export function CoverPhotoUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div>
      <p className="text-summit/40 mb-2.5 text-[10px] font-bold tracking-[0.12em] uppercase">
        Fotoja kryesore
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex h-40 w-full flex-col items-center justify-center gap-2 overflow-hidden border border-dashed transition-colors",
          dragging
            ? "border-moss bg-moss/5"
            : "border-summit/40 bg-summit/[0.02] hover:border-moss",
        )}
      >
        {preview ? (
          <span
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${preview})` }}
          />
        ) : (
          <>
            <ImagePlus className="text-summit/20 size-8" />
            <span className="text-summit/40 text-[11px] font-semibold tracking-[0.08em] uppercase">
              Zvarrit dhe lësho foton këtu
            </span>
            <span className="text-summit/20 text-[10px]">
              JPG, PNG deri në 10MB
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
