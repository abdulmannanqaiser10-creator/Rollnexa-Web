import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { AdminCatalogForm } from "@/components/admin/AdminCatalogForm";

export const metadata = { title: "Categories — Rollnexa Admin" };

export default async function AdminCategoriesPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { machines: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Catalog</p>
        <h1 className="rn-page-title">Category Management</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <AdminCatalogForm mode="create" type="category" />
        <div className="rn-panel">
          {categories.length === 0 ? (
            <p className="text-sm text-rn-muted">No categories created yet.</p>
          ) : (
            <ul className="space-y-3">
              {categories.map((category) => (
                <li key={category.id} className="rounded-xl border border-black/5 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-rn-ink">{category.name}</p>
                      <p className="text-xs text-rn-muted">/{category.slug}</p>
                      {category.description ? (
                        <p className="mt-1 text-sm text-rn-muted">{category.description}</p>
                      ) : null}
                    </div>
                    <p className="text-xs text-rn-muted">{category._count.machines} machines</p>
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
