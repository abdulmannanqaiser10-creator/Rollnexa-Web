"use client";

import { Handshake, Search, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/home/section-header";

const STEPS = [
  {
    icon: Search,
    title: "Search Machines",
    description: "Find the equipment you need using search and filters.",
  },
  {
    icon: Handshake,
    title: "Connect With Sellers",
    description: "View machine details and contact trusted sellers.",
  },
  {
    icon: ShoppingBag,
    title: "Buy or Sell",
    description: "Complete your deal and grow your business.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-14 sm:py-16">
      <div className="rn-container">
        <SectionHeader
          align="center"
          eyebrow="Simple Process"
          title="How It Works"
          description="From search to deal — Rollnexa keeps heavy equipment buying and selling straightforward."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="rn-card relative p-6"
            >
              <span className="absolute top-5 right-5 font-display text-4xl font-bold text-rn-ink/8">
                0{index + 1}
              </span>
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-rn-gold/15 text-rn-gold">
                <step.icon className="size-6" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-rn-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-rn-muted">
                {step.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
