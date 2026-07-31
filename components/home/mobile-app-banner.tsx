import Image from "next/image";
import { Smartphone } from "lucide-react";

export function MobileAppBanner() {
  return (
    <section className="bg-rn-navy py-14 text-white sm:py-16">
      <div className="rn-container grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
            <Smartphone className="size-4" />
            Mobile App
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Take Rollnexa Anywhere!
          </h2>
          <p className="mt-4 max-w-xl text-base text-white/70">
            Buy, sell and manage your machines on the go with the Rollnexa mobile app.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#"
              aria-label="Get it on Google Play"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 text-sm font-semibold transition hover:border-rn-gold hover:text-rn-gold"
            >
              Google Play
            </a>
            <a
              href="#"
              aria-label="Download on the App Store"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 text-sm font-semibold transition hover:border-rn-gold hover:text-rn-gold"
            >
              App Store
            </a>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-rn-ink shadow-2xl">
          <Image
            src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1000&q=80"
            alt="Rollnexa mobile experience"
            fill
            className="object-cover opacity-90"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-rn-ink via-transparent to-transparent" />
          <div className="absolute right-4 bottom-4 left-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="font-display text-lg font-bold">Rollnexa App</p>
            <p className="mt-1 text-sm text-white/70">
              Search inventory, message sellers, and track listings anywhere.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
