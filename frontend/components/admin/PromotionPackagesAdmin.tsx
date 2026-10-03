"use client";
import { useState } from "react";

type PromoPackage = { id: string; name: string; slug: string; description: string | null; price: number; currency: string; durationDays: number; priority: number; placementType: string; badgeType: string; isActive: boolean; displayOrder: number };
export function PromotionPackagesAdmin({ initialPackages }: { initialPackages: PromoPackage[] }) {
  const [packages, setPackages] = useState(initialPackages);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  async function save(pkg: PromoPackage) {
    setBusy(pkg.id); setError("");
    const response = await fetch(`/api/admin/promotions/packages/${pkg.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pkg) });
    const data = await response.json().catch(() => null);
    if (!response.ok) setError(data?.error || "Could not save package");
    else setPackages((items) => items.map((item) => item.id === pkg.id ? data.package : item));
    setBusy("");
  }
  return <div className="space-y-4">
    {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    {packages.map((pkg) => <article key={pkg.id} className="grid gap-3 rounded-xl border border-black/10 bg-white p-4 md:grid-cols-6">
      <label className="text-xs">Name<input className="mt-1 h-9 w-full rounded border px-2 text-sm" value={pkg.name} onChange={(e) => setPackages((all) => all.map((x) => x.id === pkg.id ? { ...x, name: e.target.value } : x))} /></label>
      <label className="text-xs">Price PKR<input type="number" min="0" className="mt-1 h-9 w-full rounded border px-2 text-sm" value={pkg.price} onChange={(e) => setPackages((all) => all.map((x) => x.id === pkg.id ? { ...x, price: Number(e.target.value), currency: "PKR" } : x))} /></label>
      <label className="text-xs">Days<input type="number" min="1" className="mt-1 h-9 w-full rounded border px-2 text-sm" value={pkg.durationDays} onChange={(e) => setPackages((all) => all.map((x) => x.id === pkg.id ? { ...x, durationDays: Number(e.target.value) } : x))} /></label>
      <label className="text-xs">Priority<input type="number" min="1" className="mt-1 h-9 w-full rounded border px-2 text-sm" value={pkg.priority} onChange={(e) => setPackages((all) => all.map((x) => x.id === pkg.id ? { ...x, priority: Number(e.target.value) } : x))} /></label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={pkg.isActive} onChange={(e) => setPackages((all) => all.map((x) => x.id === pkg.id ? { ...x, isActive: e.target.checked } : x))} />Active</label>
      <button disabled={busy === pkg.id} onClick={() => save(pkg)} className="h-9 self-end rounded-lg bg-[#080D12] px-3 text-sm font-semibold text-white disabled:opacity-50">{busy === pkg.id ? "Saving…" : "Save"}</button>
    </article>)}
  </div>;
}
