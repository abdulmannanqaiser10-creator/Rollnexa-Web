import Link from "next/link";
import { MapPin } from "lucide-react";
import type { SellerDashboardMachine } from "@/lib/seller/dashboard-data";
import { EmptyState } from "@/components/seller/EmptyState";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";
import { MachineActionMenu } from "@/components/seller/MachineActionMenu";

type MyMachinesPreviewProps = {
  machines: SellerDashboardMachine[];
};

export function MyMachinesPreview({ machines }: MyMachinesPreviewProps) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(8,13,18,0.04)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-[#111827]">
            My Machines
          </h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            Latest listings in your inventory
          </p>
        </div>
        <Link
          href="/seller/machines"
          className="inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-semibold text-[#111827] hover:border-[#F5B800]"
        >
          View All Machines
        </Link>
      </div>

      {machines.length === 0 ? (
        <EmptyState
          title="You haven't listed any machines yet."
          description="Start selling your heavy equipment today."
          actionHref="/seller/machines/new"
          actionLabel="Add Your First Machine"
        />
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-[860px] w-full overflow-visible text-left">
            <thead>
              <tr className="border-b border-black/5 text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                <th className="pb-3 pr-3 font-semibold">Machine</th>
                <th className="pb-3 pr-3 font-semibold">Price</th>
                <th className="pb-3 pr-3 font-semibold">Location</th>
                <th className="pb-3 pr-3 font-semibold">Status</th>
                <th className="pb-3 pr-3 font-semibold">Interest</th>
                <th className="pb-3 pr-3 font-semibold">Created</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {machines.map((machine) => (
                <tr key={machine.id} className="align-middle">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-14 overflow-hidden rounded-xl bg-[#F6F7F9]">
                        {machine.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={machine.imageUrl}
                            alt={machine.title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[10px] text-[#6B7280]">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/machines/${machine.slug}`}
                          className="line-clamp-1 font-semibold text-[#111827] hover:text-[#B8860B]"
                        >
                          {machine.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-[#6B7280]">
                          {[machine.brandName, machine.model]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-sm font-semibold text-[#111827]">
                    {machine.priceLabel}
                  </td>
                  <td className="py-3 pr-3 text-sm text-[#6B7280]">
                    {machine.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 text-[#F5B800]" />
                        {machine.location}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <MachineStatusBadge status={machine.status} />
                  </td>
                  <td className="py-3 pr-3 text-sm text-[#6B7280]">
                    {machine.inquiryCount} inq · {machine.favoriteCount} saves
                  </td>
                  <td className="py-3 pr-3 text-sm text-[#6B7280]">
                    {new Date(machine.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end">
                      <MachineActionMenu
                        machineId={machine.id}
                        machineSlug={machine.slug}
                        machineTitle={machine.title}
                        status={machine.status}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
