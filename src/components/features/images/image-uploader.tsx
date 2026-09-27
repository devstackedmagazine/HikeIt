"use client";

import { Check, ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

import { env } from "@/config/env";
import type { ImageEntityType } from "@/lib/cloudinary/config";
import { getImageUrl } from "@/lib/cloudinary/urls";
import { downscaleImage } from "@/lib/images/downscale-image";
import { cn } from "@/lib/utils/cn";

const ACCEPT = {
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
  "image/heic": [],
  "image/heif": [],
};
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

/** Longest side after shrinking. Leaves headroom over the largest delivery
 * size (1200px gallery/cover) while keeping phone photos around 0.5–1.5MB. */
const MAX_DIMENSION = 2048;
/** Per-request ceiling, under Vercel's 4.5MB body limit with form overhead. */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Photos uploading at once. More gains little on phone networks. */
const CONCURRENCY = 2;

type ItemStatus = "queued" | "uploading" | "saving" | "done" | "error";

interface QueueItem {
  key: string;
  file: File;
  preview: string;
  status: ItemStatus;
  error?: string;
}

/** What a persistence hook reports back for one photo. */
export interface AttachResult {
  success: boolean;
  error?: string;
}

export interface ImageUploaderProps {
  entityType: ImageEntityType;
  entityId: string;
  maxFiles?: number;
  existingImages?: string[];
  onUploadComplete: (publicIds: string[]) => void;
  /**
   * Persist ONE newly uploaded photo. Called once per photo as soon as it
   * finishes uploading; a returned error marks just that photo as failed.
   */
  onUploaded?: (publicId: string) => Promise<AttachResult | void>;
  onUploadError?: (error: string) => void;
  label?: string;
  helpText?: string;
  disabled?: boolean;
}

function checkType(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) || !ext || !ALLOWED_EXTS.includes(ext)) {
    return "Lloji nuk lejohet (JPG, PNG, WebP, HEIC)";
  }
  return null;
}

async function uploadOne(
  file: File,
  entityType: ImageEntityType,
  entityId: string,
): Promise<string> {
  const fd = new FormData();
  fd.set("entityType", entityType);
  fd.set("entityId", entityId);
  fd.append("files", file);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (res.status === 413) throw new Error("Foto është shumë e madhe.");
  const data = (await res.json().catch(() => ({}))) as {
    uploaded?: { publicId: string }[];
    errors?: { error: string }[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Ngarkimi dështoi.");
  const publicId = data.uploaded?.[0]?.publicId;
  if (!publicId) throw new Error(data.errors?.[0]?.error ?? "Ngarkimi dështoi.");
  return publicId;
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
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  // Mirror of `items` for the async workers, which outlive a render. Every
  // write to `items` updates it alongside setItems.
  const itemsRef = useRef(items);

  const busy = queue.some((q) => q.status === "uploading" || q.status === "saving");
  const pending = queue.filter((q) => q.status !== "done" && q.status !== "error").length;

  const patch = useCallback((key: string, next: Partial<QueueItem>) => {
    setQueue((q) => q.map((it) => (it.key === key ? { ...it, ...next } : it)));
  }, []);

  /** Shrink → upload → persist one photo. Never throws: failures land on the item. */
  const processItem = useCallback(
    async (item: QueueItem) => {
      const fail = (error: string) => {
        patch(item.key, { status: "error", error });
        onUploadError?.(error);
      };
      patch(item.key, { status: "uploading", error: undefined });
      try {
        const shrunk = await downscaleImage(item.file, MAX_DIMENSION, 0.85);
        if (shrunk.size > MAX_UPLOAD_BYTES) {
          // Typically HEIC outside Safari, which the browser can't shrink.
          return fail("Foto është shumë e madhe. Provo JPG ose PNG.");
        }
        const publicId = await uploadOne(shrunk, entityType, entityId);

        if (onUploaded) {
          patch(item.key, { status: "saving" });
          const result = await onUploaded(publicId);
          if (result && !result.success) {
            return fail(result.error ?? "Ruajtja dështoi.");
          }
        }

        const merged = [...itemsRef.current, publicId].slice(0, maxFiles);
        itemsRef.current = merged;
        setItems(merged);
        onUploadComplete(merged);
        URL.revokeObjectURL(item.preview);
        patch(item.key, { status: "done" });
      } catch (e) {
        fail(e instanceof Error ? e.message : "Ngarkimi dështoi.");
      }
    },
    [entityType, entityId, maxFiles, onUploaded, onUploadComplete, onUploadError, patch],
  );

  /** Run items through `process`, CONCURRENCY at a time. */
  const run = useCallback(
    async (batch: QueueItem[]) => {
      let next = 0;
      const worker = async () => {
        while (next < batch.length) {
          const item = batch[next++]!;
          await processItem(item);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker),
      );
    },
    [processItem],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      setNotice(null);
      const inFlight = queue.filter((q) => q.status !== "done" && q.status !== "error").length;
      const limit = maxFiles - itemsRef.current.length - inFlight;
      if (limit <= 0) {
        setNotice(`Maksimumi ${maxFiles} foto.`);
        return;
      }
      if (accepted.length > limit) {
        setNotice(`U morën vetëm ${limit} foto — maksimumi është ${maxFiles}.`);
      }

      const batch: QueueItem[] = accepted.slice(0, limit).map((file) => {
        const typeError = checkType(file);
        return {
          key: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          status: typeError ? "error" : "queued",
          error: typeError ?? undefined,
        };
      });
      setQueue((q) => [...q.filter((it) => it.status !== "done"), ...batch]);
      void run(batch.filter((it) => it.status === "queued"));
    },
    [maxFiles, queue, run],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    // Enforced in onDrop instead: react-dropzone rejects the WHOLE drop when
    // it exceeds maxFiles, which would silently upload nothing.
    maxFiles: 0,
    disabled: disabled || !configured,
    multiple: maxFiles > 1,
  });

  function remove(publicId: string) {
    const next = items.filter((id) => id !== publicId);
    itemsRef.current = next;
    setItems(next);
    onUploadComplete(next);
  }

  function dismiss(key: string) {
    setQueue((q) => {
      const item = q.find((it) => it.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return q.filter((it) => it.key !== key);
    });
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Ngarkimi i fotove nuk është konfiguruar.
      </div>
    );
  }

  const visibleQueue = queue.filter((q) => q.status !== "done");
  const canAddMore = items.length + pending < maxFiles;

  return (
    <div className="space-y-3">
      {label ? <p className="text-sm font-medium">{label}</p> : null}

      {/* Single-image fields show their current image; multi-photo callers
          render their own saved gallery and only use the per-photo queue. */}
      {maxFiles === 1 && items.length > 0 ? (
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

      {visibleQueue.length > 0 ? (
        <ul className="space-y-1.5" aria-live="polite">
          {visibleQueue.map((item) => (
            <li
              key={item.key}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-1.5 text-xs",
                item.status === "error" && "border-destructive/40 bg-destructive/5",
              )}
            >
              <span className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={item.preview} alt="" className="size-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.file.name}</span>
                <span
                  className={cn(
                    "block truncate",
                    item.status === "error" ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {item.status === "queued"
                    ? "Në pritje…"
                    : item.status === "uploading"
                      ? "Duke ngarkuar…"
                      : item.status === "saving"
                        ? "Duke ruajtur…"
                        : item.error}
                </span>
              </span>
              {item.status === "error" ? (
                <>
                  {!checkType(item.file) ? (
                    <button
                      type="button"
                      onClick={() => void run([item])}
                      className="flex items-center gap-1 rounded px-2 py-1 font-medium hover:bg-muted"
                    >
                      <RotateCcw className="size-3.5" />
                      Provo sërish
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => dismiss(item.key)}
                    aria-label="Hiq"
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="size-3.5" />
                  </button>
                </>
              ) : (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {queue.some((q) => q.status === "done") && !busy && visibleQueue.length === 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-primary">
          <Check className="size-3.5" />
          Të gjitha fotot u ngarkuan.
        </p>
      ) : null}

      {canAddMore ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-muted-foreground transition-colors hover:bg-muted",
            isDragActive && "border-primary bg-primary/5",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <input {...getInputProps()} />
          <ImagePlus className="size-6" />
          <span className="text-sm">Tërhiq foto këtu ose kliko për të zgjedhur</span>
          <span className="text-xs">
            JPG, PNG, WebP, HEIC{maxFiles > 1 ? ` · deri ${maxFiles}` : ""}
          </span>
        </div>
      ) : null}

      {helpText ? (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      ) : null}
      {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
    </div>
  );
}
