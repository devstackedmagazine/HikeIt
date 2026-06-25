import { CloudImage } from "@/components/features/images/cloud-image";

export interface TripGalleryPhoto {
  id: string;
  publicId: string | null;
}

// Unequal widths per the design (wide · wider · wider · wide).
const WIDTHS = ["basis-[22%]", "basis-[28%]", "basis-[28%]", "basis-[22%]"];

export function TripGallery({ photos }: { photos: TripGalleryPhoto[] }) {
  if (photos.length === 0) {
    return (
      <p className="border border-dashed border-summit/12 px-6 py-10 text-center text-xs text-summit/40">
        Nuk ka foto ende. Bëhu i pari që ndan kujtimet e këtij udhëtimi.
      </p>
    );
  }

  return (
    <div className="flex h-40 gap-1">
      {photos.slice(0, 4).map((photo, i) => (
        <div key={photo.id} className={`${WIDTHS[i] ?? "basis-1/4"} grow`}>
          <CloudImage
            publicId={photo.publicId}
            size="medium"
            alt="Foto nga udhëtimi"
            fallback="trip"
            className="h-full w-full"
          />
        </div>
      ))}
    </div>
  );
}
