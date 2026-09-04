import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  buildLocalMachineImageUrl,
  isSafeMachineUploadFilename,
} from "@/lib/storage/machine-upload-url";

export {
  LOCAL_MACHINE_IMAGE_API_PREFIX,
  buildLocalMachineImageUrl,
  extractLocalMachineImageFilename,
  isSafeMachineUploadFilename,
} from "@/lib/storage/machine-upload-url";

export function getMachineUploadsDir() {
  const configured = process.env.MACHINE_UPLOAD_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.join(process.cwd(), "data", "machine-uploads");
}

/** Legacy dev path before uploads moved out of source/public. */
export function getLegacyPublicUploadsDir() {
  return path.join(process.cwd(), "public", "uploads", "machines");
}

function extensionFor(filename: string, mimeType?: string) {
  const fromName = path.extname(filename).toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  switch (mimeType) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}

function mimeTypeForFilename(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

export async function saveLocalMachineImage(
  buffer: Buffer,
  filename: string,
  mimeType?: string
) {
  const uploadsDir = getMachineUploadsDir();
  await mkdir(uploadsDir, { recursive: true });

  const storedName = `${randomUUID()}${extensionFor(filename, mimeType)}`;
  await writeFile(path.join(uploadsDir, storedName), buffer);

  return {
    storedName,
    url: buildLocalMachineImageUrl(storedName),
    publicId: `local/${storedName}`,
  };
}

export async function readLocalMachineImage(filename: string) {
  if (!isSafeMachineUploadFilename(filename)) return null;

  const candidates = [
    path.join(getMachineUploadsDir(), filename),
    path.join(getLegacyPublicUploadsDir(), filename),
  ];

  for (const filePath of candidates) {
    try {
      const buffer = await readFile(filePath);
      return {
        buffer,
        mimeType: mimeTypeForFilename(filename),
      };
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      if (code !== "ENOENT") throw error;
    }
  }

  return null;
}
