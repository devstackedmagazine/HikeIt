"use client";

import { ImagePlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploader } from "@/components/features/images/image-uploader";
import { Button } from "@/components/ui/button";
import { addTrailPhotos } from "@/server/actions/trail-photos";

export function TrailPhotoSection({
  trailId,
  trailSlug,
  isLoggedIn,
}: {
  trailId: string;
  trailSlug: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <Button
        variant="outline"
        size="sm"
        render={<Link href={`/login?redirect=/trails/${trailSlug}`} />}
      >
        <ImagePlus />
        Shto Foto
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <ImagePlus />
        Shto Foto
      </Button>
      {open ? (
        <ImageUploader
          entityType="trail"
          entityId={trailId}
          maxFiles={10}
          onUploadComplete={() => undefined}
          onUploaded={async (ids) => {
            await addTrailPhotos(trailId, ids);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
