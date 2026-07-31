"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { MACHINE_IMAGE_LIMITS } from "@/lib/validations/machine";

export type SelectedMachineImage = {
  id?: string | null;
  url: string;
  publicId?: string | null;
  alt?: string | null;
  previewUrl?: string;
};

type ImageUploaderProps = {
  value: SelectedMachineImage[];
  onChange: (images: SelectedMachineImage[]) => void;
  disabled?: boolean;
};

export function ImageUploader({ value, onChange, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const remaining = MACHINE_IMAGE_LIMITS.maxFiles - value.length;
    if (remaining <= 0) {
      setError(`You can upload up to ${MACHINE_IMAGE_LIMITS.maxFiles} images`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    setUploading(true);

    try {
      const uploaded: SelectedMachineImage[] = [];

      for (const file of files) {
        if (!MACHINE_IMAGE_LIMITS.accept.includes(file.type as (typeof MACHINE_IMAGE_LIMITS.accept)[number])) {
          setError("Only JPEG, PNG, and WebP images are allowed");
          continue;
        }
        if (file.size > MACHINE_IMAGE_LIMITS.maxBytes) {
          setError("Each image must be 5MB or smaller");
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        const body = new FormData();
        body.append("file", file);

        const response = await fetch("/api/uploads/machine-image", {
          method: "POST",
          body,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          URL.revokeObjectURL(previewUrl);
          setError(payload?.error || "Image upload failed.");
          continue;
        }

        uploaded.push({
          url: payload.image.url,
          publicId: payload.image.publicId,
          alt: file.name,
          previewUrl,
        });
      }

      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
        if (!error) {
          setError(null);
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    const next = [...value];
    const [removed] = next.splice(index, 1);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.previewUrl || image.url}
              alt={image.alt || `Machine image ${index + 1}`}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              disabled={disabled || uploading}
              className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}

        {value.length < MACHINE_IMAGE_LIMITS.maxFiles ? (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-600 transition hover:border-amber-500 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            {uploading ? "Uploading..." : "Add images"}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={MACHINE_IMAGE_LIMITS.accept.join(",")}
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <p className="text-xs text-gray-500">
        Up to {MACHINE_IMAGE_LIMITS.maxFiles} images · JPEG/PNG/WebP · max 5MB each
      </p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
