"use client";

import "yet-another-react-lightbox/styles.css";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";

import { CloudImage } from "@/components/features/images/cloud-image";
import { getImageUrl } from "@/lib/cloudinary/urls";

export interface TripGalleryPhoto {
  id: string;
  publicId: string | null;
}

// Unequal widths per the design (wide · wider · wider · wide).
const WIDTHS = ["basis-[22%]", "basis-[28%]", "basis-[28%]", "basis-[22%]"];

export function TripGallery({ photos }: { photos: TripGalleryPhoto[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <p className="border border-dashed border-summit/12 px-6 py-10 text-center text-xs text-summit/40">
        Nuk ka foto ende. Bëhu i pari që ndan kujtimet e këtij udhëtimi.
      </p>
    );
  }

  const visible = photos.slice(0, 4);
  const slides = visible
    .filter((photo) => photo.publicId != null)
    .map((photo) => ({ src: getImageUrl(photo.publicId ?? "", "original") }));

  // Each visible photo's position within `slides` (-1 if it has no image),
  // since photos without an image are skipped rather than shown blank.
  const slideIndexes = visible.reduce<number[]>((acc, photo) => {
    const prev = acc.at(-1) ?? -1;
    acc.push(photo.publicId ? prev + 1 : prev);
    return acc;
  }, []);

  return (
    <>
      <div className="flex h-40 gap-1">
        {visible.map((photo, i) => {
          const thisSlideIndex = slideIndexes[i] ?? -1;
          const hasImage = thisSlideIndex >= 0;

          return (
            <div
              key={photo.id}
              onClick={
                hasImage
                  ? () => {
                      setIndex(thisSlideIndex);
                      setOpen(true);
                    }
                  : undefined
              }
              className={`group relative overflow-hidden ${WIDTHS[i] ?? "basis-1/4"} grow ${hasImage ? "cursor-pointer" : ""}`}
            >
              <CloudImage
                publicId={photo.publicId}
                size="medium"
                alt="Foto nga udhëtimi"
                fallback="trip"
                className="h-full w-full"
                imageClassName="transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          );
        })}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        styles={{
          container: { backgroundColor: "rgba(13,31,20,0.95)" },
        }}
      />
    </>
  );
}
