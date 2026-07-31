"use client";

import { useState } from "react";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";

const emailSchema = z.string().email("Please enter a valid email address");

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid email");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess(true);
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-rn-gold py-14 sm:py-16">
      <div className="rn-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-rn-ink/70 uppercase">
            <Mail className="size-4" />
            Newsletter
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-rn-ink sm:text-4xl">
            Stay Updated
          </h2>
          <p className="mt-3 text-base text-rn-ink/75">
            Subscribe to our newsletter to get latest updates, new arrivals and exclusive offers.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-start"
          >
            <div className="flex-1 text-left">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-12 w-full rounded-lg border border-rn-ink/10 bg-white px-4 text-sm text-rn-ink outline-none focus:border-rn-ink"
                aria-invalid={Boolean(error)}
              />
              {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
              {success ? (
                <p className="mt-2 text-xs font-medium text-rn-ink">
                  Thanks for subscribing. You&apos;re on the list.
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-rn-ink px-6 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Subscribe Now
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
