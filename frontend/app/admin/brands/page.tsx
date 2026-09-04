import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { AdminCatalogForm } from "@/components/admin/AdminCatalogForm";

export const metadata = { title: "Brands — Rollnexa Admin" };

export default async function AdminBrandsPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { machines: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Catalog</p>
        <h1 className="rn-page-title">Brand Management</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <AdminCatalogForm mode="create" type="brand" />
        <div className="rn-panel">
          {brands.length === 0 ? (
            <p className="text-sm text-rn-muted">No brands created yet.</p>
          ) : (
            <ul className="space-y-3">
              {brands.map((brand) => (
                <li key={brand.id} className="rounded-xl border border-black/5 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-rn-ink">{brand.name}</p>
                      <p className="text-xs text-rn-muted">/{brand.slug}</p>
                    </div>
                    <p className="text-xs text-rn-muted">{brand._count.machines} machines</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
