import Link from "next/link";
import type { HomeMachine } from "@/lib/home/types";
import { MachineCard } from "@/components/machines/machine-card";

type RelatedMachinesProps = {
  machines: HomeMachine[];
};

export function RelatedMachines({ machines }: RelatedMachinesProps) {
  if (machines.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            More inventory
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-rn-ink">
            Similar Machines
          </h2>
        </div>
        <Link
          href="/machines"
          className="text-sm font-semibold text-rn-ink underline-offset-4 hover:underline"
        >
          Browse all
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {machines.map((machine) => (
          <MachineCard key={machine.id} machine={machine} compact />
        ))}
      </div>
    </section>
  );
}
