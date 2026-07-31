import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Subscribers — Rollnexa Admin" };

export default async function AdminSubscribersPage() {
  const session = await requireRole("ADMIN");
  if (!session) redirect("/login?callbackUrl=/admin/subscriptions/subscribers");

  const subscribers = await prisma.userSubscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      plan: true,
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="rn-eyebrow">Billing</p>
        <h1 className="rn-page-title">Premium Sellers</h1>
      </div>

      <div className="rn-panel overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left">
              <th className="px-3 py-2">Seller</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className="border-b border-black/5">
                <td className="px-3 py-3">
                  <div className="font-medium text-rn-ink">{sub.user.name || "Seller"}</div>
                  <div className="text-xs text-rn-muted">{sub.user.email}</div>
                </td>
                <td className="px-3 py-3">{sub.plan.name}</td>
                <td className="px-3 py-3">{sub.status}</td>
                <td className="px-3 py-3">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-3">{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
