import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/home/section-header";

const POSTS = [
  {
    title: "How to Choose the Right Road Roller for Your Project",
    excerpt:
      "Compare compaction types, drum sizes, and operating weight before you buy.",
    date: "Jul 12, 2026",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Excavator Maintenance Tips to Improve Performance",
    excerpt:
      "Simple service habits that reduce downtime and protect resale value.",
    date: "Jul 04, 2026",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Top 5 Construction Equipment Trends",
    excerpt:
      "From telematics to hybrid powertrains — what buyers are asking for now.",
    date: "Jun 28, 2026",
    image:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Buying Used vs New Machines",
    excerpt:
      "A practical checklist for evaluating hours, condition, and total cost of ownership.",
    date: "Jun 18, 2026",
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80",
  },
];

export function BlogSection() {
  return (
    <section id="blog" className="py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          eyebrow="Insights"
          title="Latest Blog & News"
          description="Practical guides for buying, selling, and maintaining heavy equipment."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POSTS.map((post) => (
            <article key={post.title} className="rn-card overflow-hidden">
              <div className="relative aspect-[16/10]">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              <div className="space-y-3 p-4">
                <p className="text-xs font-semibold tracking-wide text-rn-gold uppercase">
                  {post.date}
                </p>
                <h3 className="font-display text-lg leading-snug font-bold text-rn-ink">
                  {post.title}
                </h3>
                <p className="text-sm text-rn-muted">{post.excerpt}</p>
                <Link
                  href="/about"
                  className="inline-flex text-sm font-semibold text-rn-ink underline-offset-4 hover:text-rn-gold hover:underline"
                >
                  Read More
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
