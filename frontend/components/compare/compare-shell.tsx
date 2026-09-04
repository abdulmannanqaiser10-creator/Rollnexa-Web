"use client";

import { useCompareStore } from "@/lib/stores/compare-store";
import { CompareBar } from "@/components/compare/compare-bar";
import { cn } from "@/lib/utils";

export function CompareShell({ children }: { children: React.ReactNode }) {
  const count = useCompareStore((state) => state.items.length);

  return (
    <>
      <main className={cn("flex-1", count > 0 && "pb-28")}>{children}</main>
      <CompareBar />
    </>
  );
}
