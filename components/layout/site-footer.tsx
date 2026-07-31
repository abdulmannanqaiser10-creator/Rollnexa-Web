import Link from "next/link";
import { Construction, Mail, MapPin, Phone } from "lucide-react";

const MARKETPLACE = [
  { label: "Browse Machines", href: "/machines" },
  { label: "Compare Machines", href: "/compare" },
  { label: "Categories", href: "/categories" },
  { label: "Brands", href: "/brands" },
  { label: "Dealers", href: "/dealers" },
];

const SELLER_LINKS = [
  { label: "Sell Machine", href: "/sell" },
  { label: "Seller Dashboard", href: "/seller/dashboard" },
];

const COMPANY = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "How It Works", href: "/#how-it-works" },
];

const LEGAL = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

export function SiteFooter() {
  return (
    <footer className="bg-rn-ink text-white">
      <div className="rn-container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-rn-gold text-rn-ink">
                <Construction className="size-5" />
              </span>
              Rollnexa
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
              Find and buy the right heavy construction machine from trusted sellers.
              Rollnexa is built for professional equipment buyers and dealers.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/65">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-rn-gold" />
                1200 Industrial Blvd, Suite 400, Houston, TX 77002
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-rn-gold" />
                +1 (800) 555-0199
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-rn-gold" />
                support@rollnexa.com
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg font-bold text-rn-gold">Marketplace</h3>
            <ul className="mt-4 space-y-2.5">
              {MARKETPLACE.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/65 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg font-bold text-rn-gold">For Sellers</h3>
            <ul className="mt-4 space-y-2.5">
              {SELLER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/65 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 font-display text-lg font-bold text-rn-gold">Company</h3>
            <ul className="mt-4 space-y-2.5">
              {COMPANY.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/65 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg font-bold text-rn-gold">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/65 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="rn-container flex flex-col gap-2 py-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rollnexa. All rights reserved.</p>
          <p>Heavy construction equipment marketplace.</p>
        </div>
      </div>
    </footer>
  );
}
