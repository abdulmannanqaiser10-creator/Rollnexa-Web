import Link from "next/link";
import {
  ArrowRight,
  List,
  MessageSquare,
  Plus,
} from "lucide-react";

const actions = [
  {
    href: "/seller/machines/new",
    title: "Add New Machine",
    description: "Create a new machine listing",
    icon: Plus,
  },
  {
    href: "/seller/machines",
    title: "Manage My Machines",
    description: "Edit or delete your listings",
    icon: List,
  },
  {
    href: "/seller/messages",
    title: "Messages",
    description: "Chat with interested buyers",
    icon: MessageSquare,
  },
  {
    href: "/seller/inquiries",
    title: "View Inquiries",
    description: "Respond to buyer inquiries",
    icon: MessageSquare,
  },
];

export function QuickActions() {
  return (
    <section>
      <div className="mb-4">
        <h3 className="font-display text-xl font-bold text-[#111827]">
          Quick Actions
        </h3>
        <p className="mt-1 text-sm text-[#6B7280]">
          Jump into the most common seller workflows.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(8,13,18,0.04)] transition hover:-translate-y-1 hover:border-[#F5B800]/50 hover:shadow-[0_18px_40px_rgba(8,13,18,0.1)]"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#080D12] text-[#F5B800]">
                <Icon className="size-5" />
              </span>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-[#111827]">{action.title}</h4>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-[#6B7280] transition group-hover:translate-x-0.5 group-hover:text-[#F5B800]" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
