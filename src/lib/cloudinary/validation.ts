import crypto from "crypto";

import {
  ALLOWED_MIME_TYPES,
  MAGIC_BYTES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/cloudinary/config";

export function validateMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Verify the file's leading bytes match its declared type. HEIC/HEIF have no
 * stable signature here, so they pass this layer and rely on Cloudinary.
 */
export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  if (signatures.length === 0) return true; // HEIC/HEIF — validated downstream
  return signatures.some((signature) =>
    signature.every((byte, index) => buffer[index] === byte),
  );
}

export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

export function hashFileContent(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/** Our own storage key — never derived from the original filename. */
export function generateSafeKey(entityId: string, index: number): string {
  return `${entityId}_${index}_${crypto.randomUUID()}`;
}

const DANGEROUS_EXTENSIONS = [
  "exe", "sh", "bat", "cmd", "ps1", "php", "js", "ts", "html", "htm", "svg",
  "xml", "pdf", "zip", "tar", "gz", "py", "rb", "pl", "c", "cpp", "h", "dll",
  "so", "gif", "bmp", "tiff", "ico",
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Full server-side validation: allowlist, extension block, size, magic bytes. */
export function validateImageFile(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): ValidationResult {
  if (!validateMimeType(mimeType)) {
    return {
      valid: false,
      error: "Lloji i skedarit nuk lejohet. Lejohen: JPEG, PNG, WebP, HEIC",
    };
  }

  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "Lloji i skedarit nuk lejohet" };
  }

  if (!validateFileSize(buffer.length)) {
    return { valid: false, error: "Skedari është shumë i madh. Maksimumi: 10MB" };
  }

  if (!validateMagicBytes(buffer, mimeType)) {
    return {
      valid: false,
      error: "Skedari është i dëmtuar ose lloji nuk përputhet",
    };
  }

  return { valid: true };
}
