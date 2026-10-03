"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";

type Package = { id: string; name: string; slug: string; price: number; currency: string; durationDays: number };

export function PromoteListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function showPackages() {
    setOpen((value) => !value);
    if (packages.length) return;
    const response = await fetch("/api/promotions/packages");
    const data = await response.json().catch(() => null);
    if (response.ok) setPackages(data?.packages || []);
  }

  async function buy(packageSlug: string, useCredit = false) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/seller/machines/${listingId}/promotions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageSlug, useCredit }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) { setMessage(data?.error || "Unable to start promotion"); return; }
      if (data?.checkout?.checkoutUrl) window.location.assign(data.checkout.checkoutUrl);
      else { setMessage("Promotion is active."); router.refresh(); }
    } catch { setMessage("Unable to start promotion"); }
    finally { setBusy(false); }
  }

  return <div className="relative">
    <button type="button" onClick={showPackages} className="inline-flex h-9 items-center gap-1 rounded-lg border border-amber-300 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-50"><Megaphone className="size-3.5" /> Promote</button>
    {open ? <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-black/10 bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-slate-700">Choose a promotion</p>
      {packages.map((pkg) => <div key={pkg.id} className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs"><div><p className="font-semibold">{pkg.name}</p><p className="text-slate-500">{pkg.currency} {pkg.price} · {pkg.durationDays} days</p></div><div className="flex flex-col gap-1"><button disabled={busy} onClick={() => buy(pkg.slug)} className="rounded bg-slate-900 px-2 py-1 text-white disabled:opacity-50">Pay</button>{pkg.slug === "featured" ? <button disabled={busy} onClick={() => buy(pkg.slug, true)} className="rounded border px-2 py-1 disabled:opacity-50">Use credit</button> : null}</div></div>)}
      {message ? <p className="mt-2 text-xs text-red-600">{message}</p> : null}
    </div> : null}
  </div>;
}
