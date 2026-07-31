import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MachineListingForm } from "@/components/seller/machine-listing-form";
import { SellerListingFeedback } from "@/components/seller/SellerListingFeedback";
import { parseListingDescription } from "@/lib/machines/detail";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const metadata = {
  title: "Edit Machine — Rollnexa",
};

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMachinePage({ params }: EditPageProps) {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const { id } = await params;

  const [machine, categories, brands] = await Promise.all([
    prisma.machine.findFirst({
      where: { id, sellerId: session.user.id },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, url: true, publicId: true, alt: true },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!machine) notFound();

  const canEdit = machine.status === "DRAFT" || machine.status === "REJECTED";

  const { model, body } = parseListingDescription(machine.description);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          <Link href="/seller/machines" className="hover:text-amber-700">
            My Machines
          </Link>
          <span className="mx-2">/</span>
          Edit
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Machine</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update listing details and photos, then submit for admin approval.
        </p>
        <SellerListingFeedback
          machineId={machine.id}
          status={machine.status}
          rejectionReason={machine.rejectionReason}
          rejectedAt={machine.rejectedAt?.toISOString() ?? null}
        />
        {!isCloudinaryConfigured() ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Cloudinary is not configured. New uploads are saved locally to this server.
            Add <code>CLOUDINARY_*</code> env vars for cloud storage.
          </p>
        ) : null}
      </div>

      {canEdit ? (
        <MachineListingForm
          mode="edit"
          categories={categories}
          brands={brands}
          initialMachine={{
            id: machine.id,
            title: machine.title,
            categoryId: machine.categoryId,
            brandId: machine.brandId,
            model: model || "",
            year: machine.year ?? new Date().getFullYear() - 5,
            condition: machine.condition,
            hours: machine.hours ?? 0,
            price: machine.price,
            location: machine.location || "",
            description: body || "",
            status: "DRAFT",
            images: machine.images.map((image) => ({
              id: image.id,
              url: image.url,
              publicId: image.publicId,
              alt: image.alt,
            })),
          }}
        />
      ) : (
        <div className="rounded-xl border border-black/5 bg-white p-5 text-sm text-gray-600">
          This listing cannot be edited while it is {machine.status.replaceAll("_", " ").toLowerCase()}.
        </div>
      )}
    </div>
  );
}
