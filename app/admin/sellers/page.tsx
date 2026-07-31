import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { AdminUserActions } from "@/components/admin/AdminUserActions";

export const metadata = { title: "Sellers — Rollnexa Admin" };

export default async function AdminSellersPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login");

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      accountStatus: true,
      createdAt: true,
      profile: { select: { companyName: true, phone: true, city: true, country: true } },
      _count: {
        select: {
          machines: true,
        },
      },
      machines: {
        select: { status: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="rn-eyebrow">Marketplace Sellers</p>
        <h1 className="rn-page-title">Seller Management</h1>
      </header>

      {sellers.length === 0 ? (
        <div className="rn-panel text-center text-sm text-rn-muted">No sellers found.</div>
      ) : (
        <div className="space-y-3">
          {sellers.map((seller) => {
            const activeListings = seller.machines.filter((m) => m.status === "PUBLISHED").length;
            const soldMachines = seller.machines.filter((m) => m.status === "SOLD").length;
            return (
              <article key={seller.id} className="rn-panel">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-rn-ink">
                      {seller.profile?.companyName || seller.name || "Seller"}
                    </p>
                    <p className="text-sm text-rn-muted">{seller.email}</p>
                    <p className="mt-1 text-xs text-rn-muted">
                      {seller.profile?.phone || "No phone"} · Joined{" "}
                      {new Date(seller.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right text-xs text-rn-muted">
                    <p>{seller._count.machines} total listings</p>
                    <p>{activeListings} active · {soldMachines} sold</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <AdminUserActions
                    userId={seller.id}
                    role="SELLER"
                    accountStatus={seller.accountStatus}
                    isSelf={false}
                  />
                  <Link href={`/admin/machines?q=${encodeURIComponent(seller.email)}`} className="text-xs font-semibold text-rn-gold hover:underline">
                    View Machines →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
