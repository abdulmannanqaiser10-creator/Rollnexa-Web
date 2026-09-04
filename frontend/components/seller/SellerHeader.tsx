"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

type SellerHeaderProps = {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  sellerName: string;
  sellerEmail: string;
  sellerImage?: string | null;
  onMenuClick: () => void;
};

export function SellerHeader({
  title,
  breadcrumbs = [],
  sellerName,
  sellerEmail,
  sellerImage,
  onMenuClick,
}: SellerHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[seller/header-logout] failed:", error);
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-black/10 bg-white text-rn-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold text-rn-ink sm:text-2xl">
              {title}
            </h1>
            {breadcrumbs.length > 0 ? (
              <nav className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-rn-muted">
                {breadcrumbs.map((crumb, index) => (
                  <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                    {index > 0 ? <span>/</span> : null}
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-rn-ink">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-rn-ink">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-rn-muted" />
            <input
              type="search"
              placeholder="Search machines..."
              className="h-10 w-56 rounded-xl border border-black/10 bg-rn-surface pr-3 pl-9 text-sm outline-none focus:border-rn-gold lg:w-64"
            />
          </div>

          <NotificationBell />

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white py-1.5 pr-2.5 pl-1.5"
            >
              <span className="inline-flex size-8 items-center justify-center overflow-hidden rounded-lg bg-rn-ink text-xs font-bold text-rn-gold">
                {sellerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sellerImage} alt="" className="size-full object-cover" />
                ) : (
                  sellerName.charAt(0).toUpperCase()
                )}
              </span>
              <span className="hidden max-w-[9rem] truncate text-left sm:block">
                <span className="block text-xs font-semibold text-rn-ink">
                  {sellerName}
                </span>
                <span className="block truncate text-[11px] text-rn-muted">
                  {sellerEmail}
                </span>
              </span>
              <ChevronDown className="size-4 text-rn-muted" />
            </button>

            {open ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-black/5 bg-white shadow-[0_18px_40px_rgba(8,13,18,0.12)]">
                  <Link
                    href="/seller/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-rn-ink hover:bg-rn-surface"
                  >
                    <UserRound className="size-4 text-rn-gold" />
                    View Profile
                  </Link>
                  <Link
                    href="/seller/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-rn-ink hover:bg-rn-surface"
                  >
                    <Settings className="size-4 text-rn-gold" />
                    Account Settings
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-rn-ink hover:bg-rn-surface"
                  >
                    <Home className="size-4 text-rn-gold" />
                    Go to Home Page
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={cn(
                      "flex w-full items-center gap-2 border-t border-black/5 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    )}
                  >
                    <LogOut className="size-4" />
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
