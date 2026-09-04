/** Public API path prefix for locally stored machine images (not user-specific). */
export const LOCAL_MACHINE_IMAGE_API_PREFIX = "/api/storage/machines";

const SAFE_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

export function isSafeMachineUploadFilename(filename: string) {
  return SAFE_FILENAME.test(filename);
}

export function buildLocalMachineImageUrl(storedName: string) {
  return `${LOCAL_MACHINE_IMAGE_API_PREFIX}/${storedName}`;
}

export function extractLocalMachineImageFilename(
  url: string | null | undefined
): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  const prefixes = [
    `${LOCAL_MACHINE_IMAGE_API_PREFIX}/`,
    "/uploads/machines/",
    "uploads/machines/",
  ];

  for (const prefix of prefixes) {
    if (trimmed.startsWith(prefix)) {
      const filename = trimmed.slice(prefix.length).split("?")[0] ?? "";
      return isSafeMachineUploadFilename(filename) ? filename : null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname;
    if (pathname.startsWith("/uploads/machines/")) {
      const filename = pathname.slice("/uploads/machines/".length);
      return isSafeMachineUploadFilename(filename) ? filename : null;
    }
    if (pathname.startsWith(`${LOCAL_MACHINE_IMAGE_API_PREFIX}/`)) {
      const filename = pathname.slice(`${LOCAL_MACHINE_IMAGE_API_PREFIX}/`.length);
      return isSafeMachineUploadFilename(filename) ? filename : null;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Normalizes machine image URLs from the database for display.
 * Local uploads are served via the storage API; Cloudinary URLs pass through.
 */
export function resolveMachineImageUrl(
  url: string | null | undefined
): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  const localFilename = extractLocalMachineImageFilename(trimmed);
  if (localFilename) {
    return buildLocalMachineImageUrl(localFilename);
  }

  if (trimmed.startsWith(`${LOCAL_MACHINE_IMAGE_API_PREFIX}/`)) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return null;
}
