"use client";

import "yet-another-react-lightbox/styles.css";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";

import { CloudImage } from "@/components/features/images/cloud-image";
import { getImageUrl } from "@/lib/cloudinary/urls";

export interface GalleryPhoto {
  id: string;
  publicId: string;
  photographer?: string | null;
  caption?: string | null;
}

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState(-1);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setIndex(i)}
            className="block w-full break-inside-avoid overflow-hidden rounded-lg"
          >
            <CloudImage
              publicId={photo.publicId}
              size="gallery"
              alt={photo.caption ?? "Foto udhëtimi"}
              fallback="trip"
              className="aspect-[4/3] w-full transition-opacity hover:opacity-90"
            />
          </button>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={Math.max(0, index)}
        slides={photos.map((p) => ({
          src: getImageUrl(p.publicId, "original"),
          description: p.photographer ? `Foto nga ${p.photographer}` : undefined,
        }))}
      />
    </>
  );
}
