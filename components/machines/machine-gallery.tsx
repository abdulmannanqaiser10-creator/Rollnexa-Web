"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MachineDetailImage } from "@/lib/machines/detail";

type MachineGalleryProps = {
  title: string;
  images: MachineDetailImage[];
};

export function MachineGallery({ title, images }: MachineGalleryProps) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState(false);

  const hasImages = images.length > 0;
  const safeIndex = hasImages ? Math.min(index, images.length - 1) : 0;
  const current = hasImages ? images[safeIndex] : null;
  const currentBroken = current ? broken[current.id] : true;

  function go(delta: number) {
    if (!hasImages) return;
    setIndex((prev) => (prev + delta + images.length) % images.length);
  }

  return (
    <div className="space-y-3">
      <div className="rn-card relative aspect-[4/3] overflow-hidden bg-rn-surface">
        {current && !currentBroken ? (
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setLightbox(true)}
            aria-label="Open fullscreen image"
          >
            <Image
              src={current.url}
              alt={current.alt || title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              onError={() =>
                setBroken((prev) => ({ ...prev, [current.id]: true }))
              }
            />
          </button>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-rn-muted">
            <ImageOff className="size-10 opacity-50" />
            <p className="text-sm font-medium">No photo available</p>
          </div>
        )}

        {hasImages && images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-rn-gold hover:text-rn-ink"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-rn-gold hover:text-rn-ink"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute right-3 bottom-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {safeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {hasImages && images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((image, i) => {
            const isBroken = broken[image.id];
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-rn-surface",
                  i === safeIndex ? "border-rn-gold" : "border-transparent"
                )}
                aria-label={`View image ${i + 1}`}
              >
                {!isBroken ? (
                  <Image
                    src={image.url}
                    alt={image.alt || `${title} thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                    onError={() =>
                      setBroken((prev) => ({ ...prev, [image.id]: true }))
                    }
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-rn-muted">
                    <ImageOff className="size-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {lightbox && current && !currentBroken ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close lightbox"
            onClick={() => setLightbox(false)}
          />
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-rn-ink"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <div className="relative z-10 h-[80vh] w-full max-w-5xl">
            <Image
              src={current.url}
              alt={current.alt || title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
