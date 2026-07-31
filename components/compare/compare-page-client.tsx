"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { GitCompareArrows, Trash2, X } from "lucide-react";
import type { CompareMachineDetail } from "@/lib/compare/types";
import { useCompareStore, MAX_COMPARE } from "@/lib/stores/compare-store";
import { cn } from "@/lib/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80";

const emptySubscribe = () => () => {};

type Row = {
  key: string;
  label: string;
  getValue: (m: CompareMachineDetail) => string;
  highlightDiff?: boolean;
};

const ROWS: Row[] = [
  { key: "brand", label: "Brand", getValue: (m) => m.brandName },
  { key: "category", label: "Category", getValue: (m) => m.categoryName },
  {
    key: "model",
    label: "Model",
    getValue: (m) => m.model || "—",
  },
  { key: "price", label: "Price", getValue: (m) => m.priceLabel, highlightDiff: true },
  {
    key: "year",
    label: "Year",
    getValue: (m) => (m.year != null ? String(m.year) : "—"),
    highlightDiff: true,
  },
  {
    key: "hours",
    label: "Hours",
    getValue: (m) =>
      m.hours != null ? `${m.hours.toLocaleString()} hrs` : "—",
    highlightDiff: true,
  },
  { key: "condition", label: "Condition", getValue: (m) => m.conditionLabel },
  {
    key: "location",
    label: "Location",
    getValue: (m) => m.location || "—",
  },
  { key: "seller", label: "Seller", getValue: (m) => m.sellerName },
];

export function ComparePageClient() {
  const items = useCompareStore((state) => state.items);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [machines, setMachines] = useState<CompareMachineDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;

    const ids = items.map((item) => item.id).join(",");
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/compare?ids=${encodeURIComponent(ids)}`);
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.error || "Unable to load comparison");
        }
        if (!cancelled) {
          setMachines(result.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load comparison"
          );
          setMachines([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [hydrated, items]);

  function removeMachine(id: string) {
    remove(id);
  }

  const displayMachines = items.length === 0 ? [] : machines;

  if (!hydrated) {
    return (
      <div className="bg-rn-surface py-10 sm:py-12">
        <div className="rn-container">
          <div className="h-8 w-56 animate-pulse rounded bg-black/10" />
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-black/5" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-rn-surface py-10 sm:py-12">
        <div className="rn-container">
          <div className="rn-card mx-auto max-w-lg p-10 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-rn-ink/5">
              <GitCompareArrows className="size-6 text-rn-muted" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-rn-ink">
              No machines to compare
            </h1>
            <p className="mt-2 text-sm text-rn-muted">
              Add up to {MAX_COMPARE} machines from browse or machine details,
              then compare them side by side.
            </p>
            <Link
              href="/machines"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Browse Machines
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rn-surface py-10 sm:py-12">
      <div className="rn-container space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
              Comparison
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-rn-ink">
              Compare Machines
            </h1>
            <p className="mt-2 text-sm text-rn-muted">
              Side-by-side specs for {items.length} of {MAX_COMPARE} selected
              machines.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-rn-ink"
            >
              <Trash2 className="size-4" />
              Clear All
            </button>
            <Link
              href="/machines"
              className="inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Add More
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rn-card h-72 animate-pulse bg-black/5" />
        ) : displayMachines.length === 0 ? (
          <div className="rn-card p-8 text-center text-sm text-rn-muted">
            Selected machines are no longer available. Clear the list and try
            again.
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="space-y-4 lg:hidden">
              {displayMachines.map((machine) => (
                <article key={machine.id} className="rn-card overflow-hidden">
                  <div className="relative aspect-[16/10] bg-rn-surface">
                    <Image
                      src={machine.imageUrl || FALLBACK}
                      alt={machine.title}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                    <button
                      type="button"
                      onClick={() => removeMachine(machine.id)}
                      aria-label={`Remove ${machine.title}`}
                      className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-rn-ink"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-rn-ink">
                        {machine.title}
                      </h2>
                      <p className="text-sm font-semibold text-rn-ink">
                        {machine.priceLabel}
                      </p>
                    </div>
                    <dl className="space-y-2 text-sm">
                      {ROWS.map((row) => (
                        <div
                          key={row.key}
                          className="flex justify-between gap-3 border-b border-black/5 pb-2"
                        >
                          <dt className="text-rn-muted">{row.label}</dt>
                          <dd className="font-medium text-rn-ink text-right">
                            {row.getValue(machine)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <Link
                      href={`/machines/${machine.slug}`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-rn-ink text-sm font-semibold text-white"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop: comparison table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[720px] border-collapse overflow-hidden rounded-2xl border border-black/5 bg-white text-sm shadow-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-40 bg-rn-surface p-4 text-left font-semibold text-rn-muted">
                      Spec
                    </th>
                    {displayMachines.map((machine) => (
                      <th
                        key={machine.id}
                        className="min-w-[220px] border-l border-black/5 p-4 align-top"
                      >
                        <div className="relative mx-auto aspect-[4/3] w-full max-w-[220px] overflow-hidden rounded-xl bg-rn-surface">
                          <Image
                            src={machine.imageUrl || FALLBACK}
                            alt={machine.title}
                            fill
                            className="object-cover"
                            sizes="220px"
                          />
                          <button
                            type="button"
                            onClick={() => removeMachine(machine.id)}
                            aria-label={`Remove ${machine.title}`}
                            className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-rn-ink"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <p className="mt-3 font-display text-base font-bold text-rn-ink">
                          {machine.title}
                        </p>
                        <Link
                          href={`/machines/${machine.slug}`}
                          className="mt-2 inline-flex text-xs font-semibold text-rn-gold underline-offset-4 hover:underline"
                        >
                          View Details →
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, index) => {
                    const values = displayMachines.map((m) => row.getValue(m));
                    const allSame =
                      row.highlightDiff &&
                      values.length > 1 &&
                      values.every((v) => v === values[0]);

                    return (
                      <tr
                        key={row.key}
                        className={index % 2 === 0 ? "bg-white" : "bg-rn-surface/60"}
                      >
                        <th className="sticky left-0 z-10 bg-inherit p-4 text-left font-semibold text-rn-muted">
                          {row.label}
                        </th>
                        {displayMachines.map((machine, colIndex) => (
                          <td
                            key={machine.id}
                            className={cn(
                              "border-l border-black/5 p-4 font-medium text-rn-ink",
                              row.highlightDiff &&
                                !allSame &&
                                "bg-rn-gold/10"
                            )}
                          >
                            {values[colIndex]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
