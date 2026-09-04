"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompareMachine = {
  id: string;
  slug: string;
  title: string;
  priceLabel: string;
  brandName: string | null;
  year: number | null;
  imageUrl: string | null;
  categoryName?: string | null;
  condition?: string | null;
  location?: string | null;
};

export const MAX_COMPARE = 3; // Keep in sync with COMPARE_LIMIT in lib/compare/query.ts

type CompareState = {
  items: CompareMachine[];
  add: (machine: CompareMachine) => { ok: boolean; message: string };
  remove: (id: string) => void;
  toggle: (machine: CompareMachine) => { ok: boolean; message: string };
  clear: () => void;
  has: (id: string) => boolean;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      has: (id) => get().items.some((item) => item.id === id),
      add: (machine) => {
        const current = get().items;
        if (current.some((item) => item.id === machine.id)) {
          return { ok: true, message: "Already in compare list" };
        }
        if (current.length >= MAX_COMPARE) {
          return {
            ok: false,
            message: `You can compare up to ${MAX_COMPARE} machines`,
          };
        }
        set({ items: [...current, machine] });
        return { ok: true, message: "Added to compare" };
      },
      remove: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      toggle: (machine) => {
        if (get().has(machine.id)) {
          get().remove(machine.id);
          return { ok: true, message: "Removed from compare" };
        }
        return get().add(machine);
      },
      clear: () => set({ items: [] }),
    }),
    { name: "rollnexa-compare" }
  )
);
