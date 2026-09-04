import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MachineListingForm } from "@/components/seller/machine-listing-form";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const metadata = {
  title: "Add Machine — Rollnexa",
};

export default async function NewMachinePage() {
  const session = await requireRole("SELLER");
  if (!session) redirect("/login");

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[#111827]">Add Machine</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Create a professional listing for your heavy construction equipment.
        </p>
        {!isCloudinaryConfigured() ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Cloudinary is not configured yet. Uploads will be saved locally on this
            server. Add <code>CLOUDINARY_*</code> env vars for cloud storage.
          </p>
        ) : null}
      </div>

      <MachineListingForm categories={categories} brands={brands} />
    </div>
  );
}
