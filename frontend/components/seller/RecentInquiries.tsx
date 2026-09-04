import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { SellerDashboardInquiry } from "@/lib/seller/dashboard-data";
import { EmptyState } from "@/components/seller/EmptyState";
import { MachineStatusBadge } from "@/components/seller/MachineStatusBadge";

type RecentInquiriesProps = {
  inquiries: SellerDashboardInquiry[];
};

export function RecentInquiries({ inquiries }: RecentInquiriesProps) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(8,13,18,0.04)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-[#111827]">
            Recent Inquiries
          </h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            Latest buyer messages on your listings
          </p>
        </div>
        <Link
          href="/seller/inquiries"
          className="text-sm font-semibold text-[#111827] underline-offset-4 hover:underline"
        >
          View all
        </Link>
      </div>

      {inquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No buyer inquiries yet."
          description="Your inquiries will appear here when buyers contact you."
          actionHref="/machines"
          actionLabel="View Marketplace"
        />
      ) : (
        <ul className="space-y-3">
          {inquiries.map((inquiry) => (
            <li
              key={inquiry.id}
              className="rounded-xl border border-black/5 bg-[#F6F7F9]/70 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#080D12] text-sm font-bold text-[#F5B800]">
                  {inquiry.buyerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={inquiry.buyerImage}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    inquiry.buyerName.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#111827]">
                      {inquiry.buyerName}
                    </p>
                    <MachineStatusBadge status={inquiry.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    {inquiry.machineTitle} ·{" "}
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-[#111827]/80">
                    {inquiry.message}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/seller/inquiries/${inquiry.id}`}
                      className="inline-flex h-8 items-center rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-[#111827]"
                    >
                      View Inquiry
                    </Link>
                    <Link
                      href={`/seller/inquiries/${inquiry.id}`}
                      className="inline-flex h-8 items-center rounded-lg bg-[#080D12] px-3 text-xs font-semibold text-white"
                    >
                      Reply
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
