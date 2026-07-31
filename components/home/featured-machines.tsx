import Link from "next/link";
import type { HomeMachine } from "@/lib/home/types";
import { MachineCard } from "@/components/machines/machine-card";
import { SectionHeader } from "@/components/home/section-header";

type FeaturedMachinesProps = {
  machines: HomeMachine[];
};

export function FeaturedMachines({ machines }: FeaturedMachinesProps) {
  return (
    <section className="bg-white py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          eyebrow="Featured"
          title="Featured Machines"
          description="Highlighted heavy equipment listings from trusted sellers on Rollnexa."
          href="/machines"
          linkLabel="Browse Machines"
        />

        {machines.length === 0 ? (
          <div className="rn-card flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-rn-ink">
                No machines available yet.
              </h3>
              <p className="mt-2 max-w-xl text-sm text-rn-muted">
                Be the first seller to list your heavy equipment on Rollnexa.
              </p>
            </div>
            <Link
              href="/sell"
              className="inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink transition hover:bg-rn-gold-bright"
            >
              Sell Your Machine
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
