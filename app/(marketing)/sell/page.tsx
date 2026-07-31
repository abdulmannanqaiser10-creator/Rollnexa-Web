import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "Sell Machine",
};

export default async function SellPage() {
  const session = await getSession();

  if (session?.user?.role === "SELLER") {
    redirect("/seller/dashboard");
  }

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="bg-rn-surface py-14 sm:py-20">
      <div className="rn-container">
        <div className="rn-card mx-auto max-w-3xl overflow-hidden">
          <div className="bg-rn-ink px-6 py-10 text-white sm:px-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
              Sell on Rollnexa
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Post your heavy equipment listing
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
              Reach verified buyers across the Rollnexa marketplace. Create a seller
              account to publish machines, manage inquiries, and grow your inventory.
            </p>
          </div>
          <div className="space-y-4 px-6 py-8 sm:px-10">
            {session ? (
              <>
                <p className="text-sm text-rn-muted">
                  You&apos;re signed in as a buyer. Register a seller account or switch
                  roles with your admin to start listing machines.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
                  >
                    Create Seller Account
                  </Link>
                  <Link
                    href="/buyer/dashboard"
                    className="inline-flex h-11 items-center rounded-lg border border-rn-ink/10 px-5 text-sm font-semibold text-rn-ink"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center rounded-lg bg-rn-gold px-5 text-sm font-bold text-rn-ink"
                >
                  Register to Sell
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-lg border border-rn-ink/10 px-5 text-sm font-semibold text-rn-ink"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
