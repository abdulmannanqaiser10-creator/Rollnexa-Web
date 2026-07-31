import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="bg-rn-ink py-14 text-white sm:py-16">
      <div className="rn-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            Get Started
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Ready to Find Your Next Heavy Machine?
          </h2>
          <p className="mt-4 text-base text-white/70">
            Explore quality construction equipment from trusted sellers.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/machines"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-rn-gold px-6 text-sm font-bold text-rn-ink transition hover:bg-rn-gold-bright"
            >
              Browse Machines
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/sell"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-6 text-sm font-bold text-white transition hover:border-rn-gold hover:text-rn-gold"
            >
              Sell Your Machine
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
