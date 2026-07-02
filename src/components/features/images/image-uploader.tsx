"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { env } from "@/config/env";
import type { ImageEntityType } from "@/lib/cloudinary/config";
import { getImageUrl } from "@/lib/cloudinary/urls";
import { cn } from "@/lib/utils/cn";

const ACCEPT = {
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
  "image/heic": [],
  "image/heif": [],
};
const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

export interface ImageUploaderProps {
  entityType: ImageEntityType;
  entityId: string;
  maxFiles?: number;
  existingImages?: string[];
  onUploadComplete: (publicIds: string[]) => void;
  /** Fires with only the newly uploaded ids from a batch (persistence hook). */
  onUploaded?: (newPublicIds: string[]) => void;
  onUploadError?: (error: string) => void;
  label?: string;
  helpText?: string;
  disabled?: boolean;
}

function validateClientSide(file: File): string | null {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
  if (!allowed.includes(file.type)) {
    return `${file.name}: Lloji nuk lejohet (JPG, PNG, WebP, HEIC)`;
  }
  if (file.size > 10 * 1024 * 1024) {
    return `${file.name}: Shumë i madh (maks. 10MB)`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTS.includes(ext)) {
    return `${file.name}: Shtojca nuk lejohet`;
  }
  return null;
}

export function ImageUploader({
  entityType,
  entityId,
  maxFiles = 1,
  existingImages = [],
  onUploadComplete,
  onUploaded,
  onUploadError,
  label,
  helpText,
  disabled,
}: ImageUploaderProps) {
  const configured = Boolean(env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  const [items, setItems] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setError(null);
      setNotice(null);
      const room = maxFiles - items.length;
      if (room <= 0) {
        setError(`Maksimumi ${maxFiles} foto.`);
        return;
      }
      const batch = accepted.slice(0, room);

      for (const file of batch) {
        const clientError = validateClientSide(file);
        if (clientError) {
          setError(clientError);
          onUploadError?.(clientError);
          return;
        }
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.set("entityType", entityType);
        fd.set("entityId", entityId);
        batch.forEach((f) => fd.append("files", f));

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = (await res.json()) as {
          uploaded?: { publicId: string; isDuplicate: boolean }[];
          errors?: { fileName: string; error: string }[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Ngarkimi dështoi.");
        }

        const newIds = (data.uploaded ?? []).map((u) => u.publicId);
        if ((data.uploaded ?? []).some((u) => u.isDuplicate)) {
          setNotice("Disa foto ishin ngarkuar më parë.");
        }
        if (data.errors && data.errors.length > 0) {
          setError(data.errors[0]!.error);
          onUploadError?.(data.errors[0]!.error);
        }
        if (newIds.length > 0) {
          const merged = [...items, ...newIds].slice(0, maxFiles);
          setItems(merged);
          onUploadComplete(merged);
          onUploaded?.(newIds);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ngarkimi dështoi.";
        setError(msg);
        onUploadError?.(msg);
      } finally {
        setUploading(false);
      }
    },
    [
      entityType,
      entityId,
      items,
      maxFiles,
      onUploadComplete,
      onUploaded,
      onUploadError,
    ],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles,
    disabled: disabled || uploading || !configured,
    multiple: maxFiles > 1,
  });

  function remove(publicId: string) {
    const next = items.filter((id) => id !== publicId);
    setItems(next);
    onUploadComplete(next);
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Ngarkimi i fotove nuk është konfiguruar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label ? <p className="text-sm font-medium">{label}</p> : null}

      {items.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((publicId) => (
            <div
              key={publicId}
              className="relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                src={getImageUrl(publicId, "thumbnail")}
                alt="Foto"
                fill
                sizes="200px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => remove(publicId)}
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-destructive shadow"
                aria-label="Hiq"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {items.length < maxFiles ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-muted-foreground transition-colors hover:bg-muted",
            isDragActive && "border-primary bg-primary/5",
            (disabled || uploading) && "pointer-events-none opacity-60",
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <ImagePlus className="size-6" />
          )}
          <span className="text-sm">
            {uploading
              ? "Duke ngarkuar…"
              : "Tërhiq foto këtu ose kliko për të zgjedhur"}
          </span>
          <span className="text-xs">
            JPG, PNG, WebP, HEIC · maks. 10MB{maxFiles > 1 ? ` · deri ${maxFiles}` : ""}
          </span>
        </div>
      ) : null}

      {helpText ? (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      ) : null}
      {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
