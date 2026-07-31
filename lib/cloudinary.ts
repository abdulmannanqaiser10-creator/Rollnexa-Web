import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

function readEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
}

function hasCloudinaryConfig() {
  return Boolean(
    readEnv("CLOUDINARY_CLOUD_NAME") &&
      readEnv("CLOUDINARY_API_KEY") &&
      readEnv("CLOUDINARY_API_SECRET")
  );
}

export function isCloudinaryConfigured() {
  return hasCloudinaryConfig();
}

export function getCloudinary() {
  if (!hasCloudinaryConfig()) {
    throw new Error("Cloudinary is not configured");
  }

  cloudinary.config({
    cloud_name: readEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: readEnv("CLOUDINARY_API_KEY"),
    api_secret: readEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });

  return cloudinary;
}

export type UploadedMachineImage = {
  url: string;
  publicId: string;
  storage: "cloudinary" | "local";
};

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

async function uploadMachineImageLocally(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<UploadedMachineImage> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "machines");
  await mkdir(uploadsDir, { recursive: true });

  const storedName = `${randomUUID()}${extensionFor(filename, mimeType)}`;
  await writeFile(path.join(uploadsDir, storedName), buffer);

  const origin = readEnv("BETTER_AUTH_URL") || "http://localhost:3000";
  const absoluteUrl = `${origin.replace(/\/$/, "")}/uploads/machines/${storedName}`;

  return {
    url: absoluteUrl,
    publicId: `local/${storedName}`,
    storage: "local",
  };
}

export async function uploadMachineImageBuffer(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<UploadedMachineImage> {
  if (!hasCloudinaryConfig()) {
    return uploadMachineImageLocally(buffer, filename, mimeType);
  }

  const client = getCloudinary();

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: "rollnexa/machines",
        resource_type: "image",
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error || new Error("Upload failed"));
          return;
        }
        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      }
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    storage: "cloudinary",
  };
}
