"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  List,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SellerSidebarProps = {
  open: boolean;
  onClose: () => void;
  sellerName: string;
};

const mainNav = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/machines", label: "My Machines", icon: List },
  { href: "/seller/machines/new", label: "Add Machine", icon: Plus },
  { href: "/seller/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/seller/messages", label: "Messages", icon: MessageSquare },
  { href: "/seller/reviews", label: "Reviews", icon: Star },
  { href: "/seller/favorites", label: "Favorites", icon: Heart },
];

const businessNav = [
  { href: "/seller/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/seller/leads", label: "Leads / CRM", icon: Users },
  { href: "/seller/payments", label: "Payments", icon: CreditCard },
  { href: "/seller/subscription", label: "Subscription", icon: Sparkles },
];

const accountNav = [
  { href: "/seller/profile", label: "Profile Settings", icon: UserRound },
  { href: "/seller/settings", label: "Account Settings", icon: Settings },
];

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
    href === "/seller/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-[#F5B800]/15 text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
    >
      {active ? (
        <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#F5B800]" />
      ) : null}
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-[#F5B800]" : "text-white/55 group-hover:text-[#F5B800]"
        )}
      />
      <span>{label}</span>
    </Link>
  );
}

export function SellerSidebar({ open, onClose, sellerName }: SellerSidebarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[seller/logout] failed:", error);
      setLoggingOut(false);
    }
  }

  const content = (
    <div className="flex h-full flex-col bg-[#080D12] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div>
          <Link href="/seller/dashboard" onClick={onClose} className="font-display text-xl font-bold tracking-tight">
            Roll<span className="text-[#F5B800]">nexa</span>
          </Link>
          <p className="mt-1 text-[11px] tracking-[0.18em] text-white/45 uppercase">
            Seller Workspace
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/70 lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.2em] text-white/35 uppercase">
          Main
        </p>
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink key={item.href} {...item} onNavigate={onClose} />
          ))}
        </div>

        <p className="mt-6 mb-2 px-3 text-[10px] font-semibold tracking-[0.2em] text-white/35 uppercase">
          Business
        </p>
        <div className="space-y-1">
          {businessNav.map((item) => (
            <NavLink key={item.href} {...item} onNavigate={onClose} />
          ))}
        </div>

        <p className="mt-6 mb-2 px-3 text-[10px] font-semibold tracking-[0.2em] text-white/35 uppercase">
          Account
        </p>
        <div className="space-y-1">
          {accountNav.map((item) => (
            <NavLink key={item.href} {...item} onNavigate={onClose} />
          ))}
        </div>
      </div>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link
          href="/seller/help"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <HelpCircle className="size-4 text-white/55" />
          Help & Support
        </Link>
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <Home className="size-4 text-[#F5B800]" />
          Go to Home Page
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
        <p className="px-3 pt-2 text-xs text-white/35 truncate">{sellerName}</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        {content}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close sidebar"
            onClick={onClose}
          />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] shadow-2xl">
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
