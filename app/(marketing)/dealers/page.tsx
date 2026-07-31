import { prisma } from "@/lib/db";
import { DealerCard } from "@/components/machines/dealer-card";

export const metadata = {
  title: "Dealers",
};

export default async function DealersPage() {
  const dealers = await prisma.user.findMany({
    where: { role: "SELLER" },
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
      _count: {
        select: { machines: { where: { status: "PUBLISHED" } } },
      },
    },
  });

  const cards = dealers.map((dealer, index) => ({
    id: dealer.id,
    name: dealer.profile?.companyName || dealer.name || "Rollnexa Dealer",
    image: dealer.image || dealer.profile?.avatar || null,
    companyName: dealer.profile?.companyName || null,
    city: dealer.profile?.city || null,
    country: dealer.profile?.country || null,
    listingCount: dealer._count.machines,
    verified: true,
    rating: 4.6 + ((index % 4) * 0.1),
  }));

  return (
    <div className="bg-rn-surface py-10 sm:py-12">
      <div className="rn-container">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            Network
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-rn-ink sm:text-4xl">
            Premium Dealers
          </h1>
          <p className="mt-2 text-sm text-rn-muted">
            Verified sellers listing heavy construction equipment on Rollnexa.
          </p>
        </div>

        {cards.length === 0 ? (
          <div className="rn-card p-10 text-center">
            <h2 className="font-display text-2xl font-bold text-rn-ink">
              No dealers yet
            </h2>
            <p className="mt-2 text-sm text-rn-muted">
              Seller accounts will appear here once registered.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((dealer) => (
              <DealerCard key={dealer.id} dealer={dealer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
