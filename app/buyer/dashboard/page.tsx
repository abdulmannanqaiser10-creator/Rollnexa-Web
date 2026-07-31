import Link from "next/link";
import {
  GitCompareArrows,
  Heart,
  History,
  Star,
  MessageSquare,
  Search,
} from "lucide-react";
import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRecentlyViewedMachines } from "@/lib/recently-viewed/query";
import { countUnreadConversations } from "@/lib/messaging/query";
import { RecentlyViewedCard } from "@/components/recently-viewed/recently-viewed-card";

export const metadata = {
  title: "Buyer Dashboard — Rollnexa",
};

export default async function BuyerDashboardPage() {
  const session = await requireRole("BUYER");
  if (!session) redirect("/login");

  const [
    inquiryCount,
    favoriteCount,
    recent,
    unreadMessages,
    repliedInquiries,
  ] =
    await Promise.all([
      prisma.inquiry
        .count({ where: { buyerId: session.user.id } })
        .catch(() => 0),
      prisma.favorite
        .count({ where: { userId: session.user.id } })
        .catch(() => 0),
      getRecentlyViewedMachines(session.user.id, 4).catch(() => ({
        items: [],
        total: 0,
      })),
      countUnreadConversations(session.user.id).catch(() => 0),
      prisma.inquiry
        .count({ where: { buyerId: session.user.id, status: "REPLIED" } })
        .catch(() => 0),
    ]);

  const firstName = session.user.name?.split(" ")[0] || "Buyer";

  return (
    <div className="space-y-8">
      <section className="rn-panel overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-rn-ink via-rn-navy to-rn-ink" />
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-rn-gold/20 blur-2xl" />
        <div className="relative text-white">
          <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            Welcome back
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            Hello, {firstName}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Manage favorites, continue browsing recently viewed machines, and
            chat with sellers — all in one place.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/machines" className="rn-btn-primary">
              <Search className="size-4" />
              Browse Machines
            </Link>
            <Link
              href="/buyer/messages"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:border-rn-gold hover:text-rn-gold"
            >
              <MessageSquare className="size-4" />
              Open Messages
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Link href="/buyer/messages" className="rn-stat-card">
          <span className="rn-stat-icon">
            <MessageSquare className="size-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold text-rn-ink">
              {unreadMessages}
            </p>
            <p className="text-sm text-rn-muted">Unread messages</p>
          </div>
        </Link>
        <Link href="/buyer/favorites" className="rn-stat-card">
          <span className="rn-stat-icon">
            <Heart className="size-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold text-rn-ink">
              {favoriteCount}
            </p>
            <p className="text-sm text-rn-muted">Saved machines</p>
          </div>
        </Link>
        <Link href="/buyer/recently-viewed" className="rn-stat-card">
          <span className="rn-stat-icon">
            <History className="size-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold text-rn-ink">
              {recent.total}
            </p>
            <p className="text-sm text-rn-muted">Recently viewed</p>
          </div>
        </Link>
        <Link href="/buyer/inquiries" className="rn-stat-card">
          <span className="rn-stat-icon">
            <MessageSquare className="size-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold text-rn-ink">
              {inquiryCount}
            </p>
            <p className="text-sm text-rn-muted">Inquiries sent</p>
          </div>
        </Link>
        <Link href="/buyer/reviews" className="rn-stat-card">
          <span className="rn-stat-icon">
            <Star className="size-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold text-rn-ink">
              {repliedInquiries}
            </p>
            <p className="text-sm text-rn-muted">Review opportunities</p>
          </div>
        </Link>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-rn-ink">
              Recently Viewed
            </h3>
            <p className="mt-1 text-sm text-rn-muted">
              Pick up where you left off.
            </p>
          </div>
          <Link
            href="/buyer/recently-viewed"
            className="text-sm font-semibold text-rn-ink underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        {recent.items.length === 0 ? (
          <div className="rn-panel text-center">
            <p className="text-sm text-rn-muted">
              Machines you open will appear here.
            </p>
            <Link href="/machines" className="rn-btn-primary mt-4">
              Browse Machines
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {recent.items.map((machine) => (
              <RecentlyViewedCard key={machine.recordId} machine={machine} />
            ))}
          </div>
        )}
      </section>

      <section className="rn-panel">
        <h3 className="font-display text-lg font-bold text-rn-ink">
          Quick Actions
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/buyer/favorites", label: "My Favorites", icon: Heart },
            { href: "/buyer/messages", label: "Messages", icon: MessageSquare },
            { href: "/compare", label: "Compare Machines", icon: GitCompareArrows },
            {
              href: "/buyer/recently-viewed",
              label: "Recently Viewed",
              icon: History,
            },
            { href: "/machines", label: "Browse Machines", icon: Search },
            {
              href: "/buyer/inquiries",
              label: "My Inquiries",
              icon: MessageSquare,
            },
            { href: "/buyer/reviews", label: "My Reviews", icon: Star },
            { href: "/buyer/profile", label: "Profile Settings", icon: Search },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-black/10 bg-rn-surface px-4 py-3 text-sm font-semibold text-rn-ink transition hover:border-rn-gold"
            >
              <item.icon className="size-4 text-rn-gold" />
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
