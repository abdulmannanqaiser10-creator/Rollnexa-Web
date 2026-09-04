import Link from "next/link";
import type { HomeMachine } from "@/lib/home/types";
import { MachineCard } from "@/components/machines/machine-card";

type MachineGridProps = {
  machines: HomeMachine[];
};

export function MachineGrid({ machines }: MachineGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {machines.map((machine) => (
        <MachineCard key={machine.id} machine={machine} />
      ))}
    </div>
  );
}

export function EmptyMachines({
  clearHref = "/machines",
  title = "No Matching Machines Found",
  description = "Try adjusting your search or filters.",
  clearLabel = "Clear All Filters",
}: {
  clearHref?: string;
  title?: string;
  description?: string;
  clearLabel?: string;
}) {
  return (
    <div className="rn-card p-10 text-center">
      <h2 className="font-display text-2xl font-bold text-rn-ink">{title}</h2>
      <p className="mt-2 text-sm text-rn-muted">{description}</p>
      <Link
        href={clearHref}
        className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
      >
        {clearLabel}
      </Link>
    </div>
  );
}
