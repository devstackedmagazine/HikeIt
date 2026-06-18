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
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function persist(newIds: string[]) {
    setSaving(true);
    await addTripPhotos(tripId, newIds);
    setSaving(false);
    setDone(true);
    router.refresh();
  }

  async function remove(photoId: string) {
    if (!confirm("Fshij këtë foto?")) return;
    await deleteTripPhoto(photoId);
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
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="absolute top-1 right-1 hidden size-7 items-center justify-center rounded-full bg-background/90 text-destructive shadow group-hover:flex"
                aria-label="Fshij"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <ImageUploader
        entityType="trip"
        entityId={tripId}
        maxFiles={10}
        onUploadComplete={() => undefined}
        onUploaded={persist}
        helpText="JPG, PNG, WebP, HEIC · deri 10 foto"
      />

      {saving ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Duke ruajtur…
        </p>
      ) : done ? (
        <p className="text-sm text-primary">Faleminderit! Kujtimet u shtuan.</p>
      ) : null}
    </div>
  );
}
