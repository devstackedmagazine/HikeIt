"use client";

import { useRouter } from "next/navigation";

import { ImageUploader } from "@/components/features/images/image-uploader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setTripCover } from "@/server/actions/trip-photos";

export function TripCoverField({
  tripId,
  initialPublicId,
}: {
  tripId: string;
  initialPublicId: string | null;
}) {
  const router = useRouter();

  async function onComplete(ids: string[]) {
    await setTripCover(tripId, ids[0] ?? null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto kryesore</CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUploader
          entityType="trip"
          entityId={tripId}
          maxFiles={1}
          existingImages={initialPublicId ? [initialPublicId] : []}
          onUploadComplete={onComplete}
          helpText="Raporti 16:9 funksionon më mirë."
        />
      </CardContent>
    </Card>
  );
}
