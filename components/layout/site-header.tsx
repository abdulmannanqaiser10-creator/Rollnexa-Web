"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Construction,
  Menu,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/machines", label: "Browse Machines" },
  { href: "/categories", label: "Categories" },
  { href: "/brands", label: "Brands" },
  { href: "/dealers", label: "Dealers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type SiteHeaderProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const dashboardHref =
    user?.role === "SELLER"
      ? "/seller/dashboard"
      : user?.role === "ADMIN"
        ? "/admin"
        : "/buyer/dashboard";

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href.split("#")[0] + "/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-rn-ink/95 text-white backdrop-blur">
      <div className="rn-container">
        <div className="flex h-16 items-center gap-3 lg:h-[72px] lg:gap-5">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-lg font-bold tracking-tight sm:text-xl"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-rn-gold text-rn-ink">
              <Construction className="size-5" />
            </span>
            <span className="shrink-0">Rollnexa</span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex 2xl:gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap text-white/75 transition hover:bg-white/5 hover:text-white 2xl:px-2.5",
                  isActive(link.href) && "bg-white/10 text-rn-gold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
            <form
              action="/machines"
              className="relative hidden items-center lg:flex lg:w-52 xl:w-56 2xl:w-64"
            >
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
              <input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search machines"
                className="h-10 w-full min-w-0 rounded-lg border border-white/10 bg-white/5 pr-3 pl-9 text-sm text-white placeholder:text-white/40 outline-none focus:border-rn-gold"
              />
            </form>

            {user ? (
              <>
                <NotificationBell className="[&_button]:border-white/15 [&_button]:bg-white/5 [&_button]:text-white" />
                <Link
                  href={dashboardHref}
                  className="hidden whitespace-nowrap rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white/90 transition hover:border-rn-gold hover:text-rn-gold sm:inline-flex"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:text-white sm:inline-flex"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hidden whitespace-nowrap rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white transition hover:border-rn-gold hover:text-rn-gold sm:inline-flex"
                >
                  Register
                </Link>
              </>
            )}

            <Link
              href="/sell"
              className="rn-btn-primary hidden h-10 min-w-[122px] whitespace-nowrap px-4 sm:inline-flex"
            >
              Post Listing
            </Link>

            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/15 xl:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-white/10 py-4 xl:hidden">
            <form action="/machines" className="relative mb-4">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
              <input
                name="q"
                placeholder="Search machines"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 pr-3 pl-9 text-sm text-white placeholder:text-white/40 outline-none focus:border-rn-gold"
              />
            </form>
            <div className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5",
                    isActive(link.href) && "bg-white/10 text-rn-gold"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!user ? (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5">
                    Register
                  </Link>
                </>
              ) : (
                <Link href={dashboardHref} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
