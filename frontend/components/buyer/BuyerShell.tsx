"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GitCompareArrows,
  Heart,
  HelpCircle,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Star,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { NotificationBell } from "@/components/notifications/NotificationBell";

type BuyerShellProps = {
  buyerName: string;
  buyerEmail: string;
  buyerImage?: string | null;
  unreadMessages?: number;
  children: React.ReactNode;
};

const NAV = [
  { href: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/buyer/favorites", label: "My Favorites", icon: Heart },
  { href: "/buyer/recently-viewed", label: "Recently Viewed", icon: History },
  { href: "/buyer/inquiries", label: "My Inquiries", icon: MessageSquare },
  { href: "/buyer/messages", label: "Messages", icon: MessageSquare },
  { href: "/buyer/reviews", label: "Reviews", icon: Star },
  { href: "/buyer/profile", label: "Profile Settings", icon: UserRound },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/machines", label: "Browse Machines", icon: Search },
];

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/buyer/favorites")) return "My Favorites";
  if (pathname.startsWith("/buyer/recently-viewed")) return "Recently Viewed";
  if (pathname.startsWith("/buyer/inquiries")) return "My Inquiries";
  if (pathname.startsWith("/buyer/messages")) return "Messages";
  if (pathname.startsWith("/buyer/reviews")) return "Reviews";
  if (pathname.startsWith("/buyer/profile")) return "Profile Settings";
  if (pathname.startsWith("/compare")) return "Compare Machines";
  return "Dashboard";
}

function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/buyer/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-rn-gold/15 text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
    >
      {active ? (
        <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-rn-gold" />
      ) : null}
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-rn-gold" : "text-white/55 group-hover:text-rn-gold"
        )}
      />
      <span>{label}</span>
    </Link>
  );
}

export function BuyerShell({
  buyerName,
  buyerEmail,
  buyerImage,
  unreadMessages = 0,
  children,
}: BuyerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const title = useMemo(() => titleFromPath(pathname), [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-rn-ink text-white">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-5">
        <div>
          <Link
            href="/buyer/dashboard"
            onClick={() => setOpen(false)}
            className="font-display text-xl font-bold tracking-tight"
          >
            Roll<span className="text-rn-gold">nexa</span>
          </Link>
          <p className="mt-1 text-[11px] tracking-[0.18em] text-white/45 uppercase">
            Buyer Workspace
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/70 lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4"
        aria-label="Buyer menu"
      >
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.2em] text-white/35 uppercase">
          Menu
        </p>
        <div className="space-y-1">
          {NAV.map((item) => (
            <div key={item.href} className="relative">
              <NavLink {...item} onNavigate={() => setOpen(false)} />
              {item.href === "/buyer/messages" && unreadMessages > 0 ? (
                <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-rn-gold px-1.5 py-0.5 text-[10px] font-bold text-rn-ink">
                  {unreadMessages}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 space-y-1 border-t border-white/10 px-3 py-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <Home className="size-4 text-rn-gold" />
          Go to Marketplace
        </Link>
        <Link
          href="/contact"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <HelpCircle className="size-4 text-white/55" />
          Help & Support
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          <LogOut className="size-4 text-white/55" />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
        <div className="mt-2 flex items-center gap-3 px-3 pt-2">
          <span className="inline-flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-xs font-bold text-rn-gold">
            {buyerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={buyerImage} alt="" className="size-full object-cover" />
            ) : (
              buyerName.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{buyerName}</p>
            <p className="truncate text-[11px] text-white/45">{buyerEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rn-dashboard-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-hidden lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] overflow-hidden shadow-2xl">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-black/10 bg-white text-rn-ink lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-xl font-bold text-rn-ink sm:text-2xl">
                  {title}
                </h1>
                <p className="text-xs text-rn-muted">Buyer account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link href="/machines" className="rn-btn-primary hidden h-10 sm:inline-flex">
                <Search className="size-4" />
                Browse
              </Link>
              <span className="inline-flex size-10 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-rn-ink text-xs font-bold text-rn-gold">
                {buyerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={buyerImage} alt="" className="size-full object-cover" />
                ) : (
                  <UserRound className="size-4" />
                )}
              </span>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
