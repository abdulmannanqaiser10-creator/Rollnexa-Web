import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { saveLocalMachineImage } from "@/lib/storage/machine-uploads";

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

export async function uploadMachineImageBuffer(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<UploadedMachineImage> {
  if (!hasCloudinaryConfig()) {
    const saved = await saveLocalMachineImage(buffer, filename, mimeType);
    return {
      url: saved.url,
      publicId: saved.publicId,
      storage: "local",
    };
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
