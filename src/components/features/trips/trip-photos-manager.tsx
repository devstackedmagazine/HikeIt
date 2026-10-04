"use client";

import { Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploader } from "@/components/features/images/image-uploader";
import { getImageUrl } from "@/lib/cloudinary/urls";
import { addTripPhotos, deleteTripPhoto } from "@/server/actions/trip-photos";

export interface ManagedPhoto {
  id: string;
  publicId: string;
}

export function TripPhotosManager({
  tripId,
  photos,
  manage = false,
}: {
  tripId: string;
  photos: ManagedPhoto[];
  manage?: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(false);

  // One call per photo: the uploader attaches each as soon as it lands, so a
  // later failure never loses the ones already uploaded.
  async function persist(publicId: string) {
    const result = await addTripPhotos(tripId, [publicId]);
    if (result.success) {
      setDone(true);
      router.refresh();
    }
    return result;
  }

  // Inline confirm instead of window.confirm(): one photo at a time.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function remove(photoId: string) {
    setDeletingId(photoId);
    setDeleteError(null);
    const result = await deleteTripPhoto(photoId);
    setDeletingId(null);
    setConfirmingId(null);
    if (!result.success) {
      setDeleteError(result.error ?? "Fshirja dështoi.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {manage && photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                src={getImageUrl(p.publicId, "thumbnail")}
                alt="Foto"
                fill
                sizes="200px"
                className="object-cover"
              />
              {confirmingId === p.id ? (
                <div className="bg-abyss/85 absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center">
                  <span className="text-summit text-[10px] font-bold tracking-[0.06em] uppercase">
                    Fshi foton?
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      disabled={deletingId === p.id}
                      className="text-summit border-summit/40 border px-2.5 py-1.5 text-[10px] font-bold uppercase"
                    >
                      Jo
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(p.id)}
                      disabled={deletingId === p.id}
                      className="bg-danger text-summit flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase"
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : null}
                      Po
                    </button>
                  </div>
                </div>
              ) : (
                // Hidden until hover on mouse devices; always shown where
                // there's no hover (touch), and on keyboard focus.
                <button
                  type="button"
                  onClick={() => setConfirmingId(p.id)}
                  className="bg-background/90 text-destructive absolute top-1 right-1 hidden size-8 items-center justify-center rounded-full shadow group-focus-within:flex group-hover:flex [@media(hover:none)]:flex"
                  aria-label="Fshi foton"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}
      {manage && deleteError ? (
        <p className="text-destructive text-sm">{deleteError}</p>
      ) : null}

      <ImageUploader
        entityType="trip"
        entityId={tripId}
        maxFiles={10}
        onUploadComplete={() => undefined}
        onUploaded={persist}
        helpText="JPG, PNG, WebP, HEIC · deri 10 foto"
      />

      {done ? (
        <p className="text-sm text-primary">Faleminderit! Kujtimet u shtuan.</p>
      ) : null}
    </div>
  );
}
