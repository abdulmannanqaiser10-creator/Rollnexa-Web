"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";
import { useCompareStore, MAX_COMPARE } from "@/lib/stores/compare-store";
import { resolveMachineImageUrl } from "@/lib/storage/machine-upload-url";

const FALLBACK =
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=200&q=60";

export function CompareBar() {
  const pathname = usePathname();
  const items = useCompareStore((state) => state.items);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);

  // Hide on compare page itself and when empty
  if (items.length === 0 || pathname.startsWith("/compare")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
      <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-white/10 bg-rn-ink/95 p-3 text-white shadow-2xl backdrop-blur sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-rn-gold text-rn-ink sm:inline-flex">
              <GitCompareArrows className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Compare ({items.length}/{MAX_COMPARE})
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex shrink-0 items-center gap-2 rounded-lg bg-white/10 py-1.5 pr-8 pl-1.5"
                  >
                    <span className="relative size-9 overflow-hidden rounded-md bg-white/10">
                      <Image
                        src={resolveMachineImageUrl(item.imageUrl) || FALLBACK}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </span>
                    <span className="max-w-[7rem] truncate text-xs font-medium">
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove ${item.title} from compare`}
                      className="absolute top-1 right-1 inline-flex size-5 items-center justify-center rounded-full bg-white/15 text-white/80 hover:bg-white/25 hover:text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={clear}
              className="h-10 rounded-lg px-3 text-sm font-medium text-white/70 hover:text-white"
            >
              Clear
            </button>
            <Link
              href="/compare"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-rn-gold px-4 text-sm font-bold text-rn-ink"
            >
              Compare Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
