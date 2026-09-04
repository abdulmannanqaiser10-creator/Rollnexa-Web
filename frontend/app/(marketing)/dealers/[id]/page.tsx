import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveMachineImageUrl } from "@/lib/images/resolve-machine-image-url";
import { MachineCard } from "@/components/machines/machine-card";
import { buildBreadcrumbSchema, buildMetadata, buildSellerSchema, buildWebPageSchema } from "@/lib/seo";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const dealer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      image: true,
      profile: { select: { companyName: true, city: true, country: true, bio: true, avatar: true } },
    },
  });

  if (!dealer || dealer.role !== "SELLER") {
    return buildMetadata({ title: "Dealer Not Found", description: "The requested dealer profile could not be found.", path: "/dealers", noIndex: true });
  }

  const companyName = dealer.profile?.companyName || dealer.name || "Rollnexa Dealer";
  return buildMetadata({
    title: companyName,
    description: `Explore ${companyName}'s heavy equipment listings on Rollnexa.`,
    path: `/dealers/${id}`,
    keywords: [companyName, "heavy equipment dealer"],
  });
}

export default async function DealerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dealer = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      machines: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          brand: true,
          category: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });

  if (!dealer || dealer.role !== "SELLER") notFound();

  const name = dealer.profile?.companyName || dealer.name || "Rollnexa Dealer";
  const machines = dealer.machines.map((machine) => ({
    id: machine.id,
    title: machine.title,
    slug: machine.slug,
    price: machine.price,
    year: machine.year,
    hours: machine.hours,
    condition: machine.condition,
    location: machine.location,
    imageUrl: resolveMachineImageUrl(machine.images[0]?.url),
    brandName: machine.brand?.name ?? null,
    categoryName: machine.category?.name ?? null,
    isPremium: machine.price >= 100000,
  }));

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Dealers", path: "/dealers" },
    { name: name, path: `/dealers/${id}` },
  ]);

  return (
    <div className="bg-rn-surface py-10 sm:py-12">
      <SeoJsonLd data={breadcrumbSchema} />
      <SeoJsonLd data={buildSellerSchema({ name: dealer.name ?? "Rollnexa Dealer", companyName: dealer.profile?.companyName ?? null, description: dealer.profile?.bio ?? null, city: dealer.profile?.city ?? null, country: dealer.profile?.country ?? null, image: dealer.image || dealer.profile?.avatar || null, slug: id })} />
      <SeoJsonLd data={buildWebPageSchema(`/dealers/${id}`, name, dealer.profile?.bio || `Explore ${name}'s heavy equipment listings on Rollnexa.`)} />
      <div className="rn-container space-y-8">
        <div className="rn-card p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            Dealer Profile
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-rn-ink">{name}</h1>
          <p className="mt-2 text-sm text-rn-muted">
            {[dealer.profile?.city, dealer.profile?.country].filter(Boolean).join(", ") ||
              "Location not provided"}
          </p>
          {dealer.profile?.bio ? (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-rn-charcoal">
              {dealer.profile.bio}
            </p>
          ) : null}
          <Link
            href="/dealers"
            className="mt-6 inline-flex text-sm font-semibold text-rn-ink underline-offset-4 hover:underline"
          >
            Back to dealers
          </Link>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-rn-ink">Listings</h2>
          {machines.length === 0 ? (
            <p className="mt-3 text-sm text-rn-muted">No published machines yet.</p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {machines.map((machine) => (
                <MachineCard key={machine.id} machine={machine} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
