import { type NextRequest, NextResponse } from "next/server";

import { getOptionalSession } from "@/lib/auth/helpers";
import {
  type ImageEntityType,
  MAX_FILES_PER_UPLOAD,
} from "@/lib/cloudinary/config";
import { uploadImage } from "@/lib/cloudinary/upload";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { canUploadImage } from "@/server/services/entity-access";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_ENTITY_TYPES: ImageEntityType[] = [
  "trip",
  "club",
  "trail",
  "avatar",
];

export async function POST(request: NextRequest) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json(
      { error: "Kyçuni për të ngarkuar foto" },
      { status: 401 },
    );
  }

  // Before the body is read, so a flood of requests is cheap to turn away.
  const limited = await enforceRateLimit("ratelimit.upload.request", {
    userId: session.user.id,
  });
  if (limited) {
    return NextResponse.json({ error: limited }, { status: 429 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  const entityType = String(formData.get("entityType") ?? "");
  const entityId = String(formData.get("entityId") ?? "");

  if (!VALID_ENTITY_TYPES.includes(entityType as ImageEntityType)) {
    return NextResponse.json(
      { error: "Lloji i entitetit është i pavlefshëm" },
      { status: 400 },
    );
  }
  if (!entityId) {
    return NextResponse.json({ error: "Mungon entityId" }, { status: 400 });
  }
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Asnjë skedar nuk u ngarkua" },
      { status: 400 },
    );
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return NextResponse.json(
      { error: `Maksimumi ${MAX_FILES_PER_UPLOAD} foto për ngarkesë` },
      { status: 400 },
    );
  }
  if (
    !(await canUploadImage(
      session.user.id,
      entityType as ImageEntityType,
      entityId,
    ))
  ) {
    return NextResponse.json(
      { error: "Nuk keni qasje për të ngarkuar foto këtu" },
      { status: 403 },
    );
  }

  const uploaded = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadImage(buffer, file.type, file.name, {
        entityType: entityType as ImageEntityType,
        entityId,
        userId: session.user.id,
        index: i,
      });
      uploaded.push(result);
    } catch (error) {
      errors.push({
        fileName: file.name,
        error: error instanceof Error ? error.message : "Ngarkimi dështoi",
      });
    }
  }

  return NextResponse.json({
    success: true,
    uploaded,
    errors,
    totalUploaded: uploaded.length,
    totalFailed: errors.length,
  });
}
