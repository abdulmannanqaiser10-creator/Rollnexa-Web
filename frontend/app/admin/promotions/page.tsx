import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PromotionPackagesAdmin } from "@/components/admin/PromotionPackagesAdmin";
import { ensureDefaultPromotionPackages } from "@/lib/promotions/service";

export const metadata = { title: "Promotions — Rollnexa Admin" };
export default async function AdminPromotionsPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login?callbackUrl=/admin/promotions");
  await ensureDefaultPromotionPackages();
  const [packages, promotions] = await Promise.all([
    prisma.promotionPackage.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.listingPromotion.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { seller: { select: { name: true, email: true } }, listing: { select: { title: true } } } }),
  ]);
  return <div className="space-y-8"><div><p className="rn-eyebrow">Monetization</p><h1 className="rn-page-title">Listing Promotions</h1><p className="mt-2 text-sm text-rn-muted">Manage ad packages and review current and historical promotions.</p></div>
    <section className="space-y-3"><h2 className="text-lg font-bold">Packages</h2><PromotionPackagesAdmin initialPackages={packages} /></section>
    <section className="space-y-3"><h2 className="text-lg font-bold">Recent promotions</h2><div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Seller</th><th className="p-3">Listing</th><th className="p-3">Package</th><th className="p-3">Status</th><th className="p-3">Period</th></tr></thead><tbody>{promotions.map((item) => <tr key={item.id} className="border-t"><td className="p-3">{item.seller.name || item.seller.email}</td><td className="p-3">{item.listing.title}</td><td className="p-3">{item.packageNameSnapshot}</td><td className="p-3">{item.status}</td><td className="p-3">{item.startAt?.toLocaleDateString() || "Pending"} – {item.endAt?.toLocaleDateString() || "—"}</td></tr>)}</tbody></table></div></section>
  </div>;
}
