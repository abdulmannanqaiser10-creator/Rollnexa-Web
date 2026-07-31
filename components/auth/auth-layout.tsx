import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { TrustFeatures } from "./trust-features";

interface AuthLayoutProps {
  children: React.ReactNode;
  badge: string;
  headline: string;
  description: string;
}

function AuthLayout({
  children,
  badge,
  headline,
  description,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-rn-ink">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-rn-navy p-10 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-rn-ink via-rn-navy to-black" />
        <div className="absolute -top-20 right-0 size-72 rounded-full bg-rn-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 size-56 rounded-full bg-rn-gold/5 blur-3xl" />

        <div className="absolute inset-0 opacity-[0.06]">
          <svg
            viewBox="0 0 800 600"
            fill="none"
            className="h-full w-full"
            aria-hidden="true"
          >
            <rect x="100" y="300" width="400" height="120" rx="12" fill="white" />
            <rect x="500" y="200" width="200" height="220" rx="12" fill="white" />
            <rect x="150" y="250" width="300" height="60" rx="8" fill="white" />
            <circle cx="200" cy="460" r="50" fill="white" />
            <circle cx="500" cy="460" r="50" fill="white" />
            <circle cx="600" cy="460" r="35" fill="white" />
            <rect x="600" y="100" width="20" height="160" rx="4" fill="white" />
            <rect x="550" y="80" width="100" height="30" rx="6" fill="white" />
            <rect x="300" y="180" width="200" height="80" rx="8" fill="white" />
          </svg>
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rn-gold">
              <Construction size={22} className="text-rn-ink" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Rollnexa
            </span>
          </Link>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <div className="relative z-10 space-y-5">
          <span className="inline-block rounded-full border border-rn-gold/40 bg-rn-gold/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-rn-gold uppercase">
            {badge}
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight text-white lg:text-5xl">
            {headline}
          </h1>
          <p className="max-w-md text-lg text-white/60">{description}</p>
        </div>

        <div className="relative z-10">
          <TrustFeatures />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-rn-surface p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rn-gold">
                <Construction size={22} className="text-rn-ink" />
              </div>
              <span className="font-display text-xl font-bold text-rn-ink">
                Rollnexa
              </span>
            </Link>
          </div>

          <div className="rn-card p-8 shadow-[0_24px_60px_rgba(8,13,18,0.12)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AuthLayout };
