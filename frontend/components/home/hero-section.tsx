import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { HERO_IMAGE } from "@/lib/home/types";
import { MachineSearchBar } from "@/components/home/machine-search-bar";

type HeroSectionProps = {
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
};

export function HeroSection({ categories, brands }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-rn-ink text-white">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Road roller heavy construction equipment"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rn-ink via-rn-ink/88 to-rn-ink/50" />
        <div className="absolute inset-0 bg-rn-ink/30" />
      </div>

      <div className="rn-container relative pt-16 pb-28 sm:pt-20 sm:pb-32 lg:pt-24 lg:pb-36">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-rn-gold/40 bg-rn-gold/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-rn-gold uppercase">
            Heavy Construction Equipment Marketplace
          </span>

          <h1 className="mt-6 font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find the Right Heavy Machine
            <br />
            for Your Next{" "}
            <span className="text-rn-gold">Project</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Buy and sell road rollers, excavators, bulldozers, cranes, loaders, and
            other heavy construction equipment from trusted sellers.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/machines"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-rn-gold px-6 text-sm font-bold text-rn-ink transition hover:bg-rn-gold-bright"
            >
              Browse Machines
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/sell"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 bg-white/5 px-6 text-sm font-bold text-white backdrop-blur transition hover:border-rn-gold hover:text-rn-gold"
            >
              Sell Your Machine
            </Link>
          </div>
        </div>
      </div>

      <div className="rn-container relative z-10 -mt-16 pb-8 sm:-mt-20">
        <MachineSearchBar categories={categories} brands={brands} />
      </div>
    </section>
  );
}
