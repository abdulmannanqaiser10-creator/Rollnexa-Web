import {
  CheckCircle2,
  MessageSquare,
  Package,
  UserRound,
} from "lucide-react";
import type { SellerDashboardActivity } from "@/lib/seller/dashboard-data";
import { EmptyState } from "@/components/seller/EmptyState";

type RecentActivityProps = {
  activity: SellerDashboardActivity[];
};

const iconMap = {
  machine: Package,
  inquiry: MessageSquare,
  sold: CheckCircle2,
  profile: UserRound,
};

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(8,13,18,0.04)] sm:p-6">
      <div className="mb-5">
        <h3 className="font-display text-xl font-bold text-[#111827]">
          Recent Activity
        </h3>
        <p className="mt-1 text-sm text-[#6B7280]">
          A timeline of your latest seller events
        </p>
      </div>

      {activity.length === 0 ? (
        <EmptyState
          title="No recent activity"
          description="Listing updates and buyer inquiries will show up here."
          className="border-0 bg-[#F6F7F9]/70"
        />
      ) : (
        <ol className="space-y-4">
          {activity.map((item) => {
            const Icon = iconMap[item.type];
            return (
              <li key={item.id} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#080D12] text-[#F5B800]">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-[#6B7280]">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
