import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact Rollnexa",
  description: "Get in touch with Rollnexa for support, dealer inquiries, or marketplace questions.",
  path: "/contact",
  keywords: ["contact rollnexa", "heavy equipment support"],
});

export default function ContactPage() {
  return (
    <div className="bg-rn-surface py-14">
      <div className="rn-container max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-rn-gold uppercase">
          Contact
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-rn-ink">
          We&apos;re here to help
        </h1>
        <div className="rn-card mt-8 space-y-3 p-6 text-sm text-rn-charcoal">
          <p>
            <span className="font-semibold">Email:</span> support@rollnexa.com
          </p>
          <p>
            <span className="font-semibold">Phone:</span> +1 (800) 555-0199
          </p>
          <p>
            <span className="font-semibold">Address:</span> 1200 Industrial Blvd,
            Suite 400, Houston, TX 77002
          </p>
          <p>
            <span className="font-semibold">Hours:</span> Mon–Fri, 8:00 AM – 6:00 PM
          </p>
        </div>
      </div>
    </div>
  );
}
