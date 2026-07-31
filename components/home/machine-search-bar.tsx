"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search, Tag, Layers3 } from "lucide-react";

type Option = { id: string; name: string; slug: string };

type MachineSearchBarProps = {
  categories: Option[];
  brands: Option[];
};

export function MachineSearchBar({ categories, brands }: MachineSearchBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [location, setLocation] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (location.trim()) params.set("location", location.trim());
    const query = params.toString();
    router.push(query ? `/machines?${query}` : "/machines");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rn-card grid gap-3 p-4 text-rn-ink shadow-[0_20px_50px_rgba(8,13,18,0.18)] sm:p-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
    >
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-rn-muted uppercase">
          <Search className="size-3.5 text-rn-gold" />
          Search Machine
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Road roller, excavator, brand..."
          className="h-11 w-full rounded-lg border border-black/10 bg-rn-surface px-3 text-sm outline-none focus:border-rn-gold"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-rn-muted uppercase">
          <Layers3 className="size-3.5 text-rn-gold" />
          Category
        </span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 w-full rounded-lg border border-black/10 bg-rn-surface px-3 text-sm outline-none focus:border-rn-gold"
        >
          <option value="">All Categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-rn-muted uppercase">
          <Tag className="size-3.5 text-rn-gold" />
          Brand
        </span>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="h-11 w-full rounded-lg border border-black/10 bg-rn-surface px-3 text-sm outline-none focus:border-rn-gold"
        >
          <option value="">All Brands</option>
          {brands.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-rn-muted uppercase">
          <MapPin className="size-3.5 text-rn-gold" />
          Location
        </span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Select location"
          className="h-11 w-full rounded-lg border border-black/10 bg-rn-surface px-3 text-sm outline-none focus:border-rn-gold"
        />
      </label>

      <div className="flex items-end">
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink transition hover:bg-rn-gold-bright lg:min-w-[160px]"
        >
          <Search className="size-4" />
          Search Machines
        </button>
      </div>
    </form>
  );
}
