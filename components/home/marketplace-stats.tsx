import { formatCount } from "@/lib/format";
import type { HomeStats } from "@/lib/home/types";

type MarketplaceStatsProps = {
  stats: HomeStats;
};

const LABELS = [
  { key: "machines" as const, label: "Total Machines", fallback: 12540 },
  { key: "dealers" as const, label: "Total Dealers", fallback: 1850 },
  { key: "buyers" as const, label: "Total Buyers", fallback: 45230 },
  { key: "cities" as const, label: "Cities Covered", fallback: 350 },
  { key: "deals" as const, label: "Successful Deals", fallback: 8920 },
];

export function MarketplaceStats({ stats }: MarketplaceStatsProps) {
  return (
    <section className="bg-rn-ink py-14 text-white sm:py-16">
      <div className="rn-container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            Marketplace Impact
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Growing with the construction industry
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">
          {LABELS.map((item) => {
            const live = stats[item.key];
            const value = live > 0 ? live : item.fallback;
            const suffix = live > 0 ? "+" : "+";
            return (
              <div key={item.key} className="text-center">
                <p className="font-display text-3xl font-bold text-rn-gold sm:text-4xl">
                  {formatCount(value)}
                  {suffix}
                </p>
                <p className="mt-2 text-sm text-white/70">{item.label}</p>
                {live === 0 ? (
                  <p className="mt-1 text-[10px] tracking-wide text-white/35 uppercase">
                    Projected network
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
