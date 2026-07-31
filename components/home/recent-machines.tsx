import Link from "next/link";
import type { HomeMachine } from "@/lib/home/types";
import { MachineCard } from "@/components/machines/machine-card";
import { SectionHeader } from "@/components/home/section-header";

type RecentMachinesProps = {
  machines: HomeMachine[];
};

export function RecentMachines({ machines }: RecentMachinesProps) {
  return (
    <section className="py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          eyebrow="Fresh Inventory"
          title="Recently Added Machines"
          description="Newest published listings sorted by arrival date."
          href="/machines?sort=newest"
          linkLabel="See Latest"
        />

        {machines.length === 0 ? (
          <div className="rn-card p-8">
            <h3 className="font-display text-xl font-bold text-rn-ink">
              No recent listings yet
            </h3>
            <p className="mt-2 max-w-xl text-sm text-rn-muted">
              Once sellers publish machines, the newest inventory will show up here.
            </p>
            <Link
              href="/sell"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
            >
              Sell Your Machine
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} compact />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
