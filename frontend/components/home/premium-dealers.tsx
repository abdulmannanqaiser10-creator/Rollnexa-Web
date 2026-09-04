import Link from "next/link";
import type { HomeDealer } from "@/lib/home/types";
import { DealerCard } from "@/components/machines/dealer-card";
import { SectionHeader } from "@/components/home/section-header";

type PremiumDealersProps = {
  dealers: HomeDealer[];
};

export function PremiumDealers({ dealers }: PremiumDealersProps) {
  return (
    <section className="py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          eyebrow="Trusted Network"
          title="Premium Dealers"
          description="Connect with verified sellers who list quality heavy equipment worldwide."
          href="/dealers"
          linkLabel="View All Dealers"
        />

        {dealers.length === 0 ? (
          <div className="rn-card p-8 text-center">
            <h3 className="font-display text-xl font-bold text-rn-ink">
              Dealers coming soon
            </h3>
            <p className="mt-2 text-sm text-rn-muted">
              Register as a seller to appear in the premium dealers directory.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-rn-ink px-5 text-sm font-bold text-white"
            >
              Become a Seller
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dealers.map((dealer) => (
              <DealerCard key={dealer.id} dealer={dealer} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
