import { Star } from "lucide-react";
import { SectionHeader } from "@/components/home/section-header";

const TESTIMONIALS = [
  {
    name: "James Carter",
    role: "Fleet Manager, Texas",
    quote:
      "Rollnexa helped us source a road roller in under a week. Verified sellers and clear listings saved us days of back-and-forth.",
  },
  {
    name: "Amina Rahman",
    role: "Site Supervisor, Dubai",
    quote:
      "The search filters are excellent. We compared excavators by hours, location, and condition before making a confident offer.",
  },
  {
    name: "Marco Silva",
    role: "Equipment Dealer, Brazil",
    quote:
      "Listing our inventory on Rollnexa brought serious buyers quickly. The marketplace feels premium and professional.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          align="center"
          eyebrow="Reviews"
          title="What Our Customers Say"
          description="Buyers and dealers trust Rollnexa for serious heavy equipment transactions."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <article key={item.name} className="rn-card p-6">
              <div className="flex gap-1 text-rn-gold">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-4 fill-rn-gold" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-rn-charcoal">
                “{item.quote}”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-rn-ink font-bold text-rn-gold">
                  {item.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold text-rn-ink">{item.name}</p>
                  <p className="text-xs text-rn-muted">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
