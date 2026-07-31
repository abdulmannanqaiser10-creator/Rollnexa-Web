import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Rollnexa — Heavy Construction Equipment Marketplace",
    template: "%s — Rollnexa",
  },
  description:
    "Buy and sell heavy construction equipment with confidence. Road rollers, excavators, cranes, bulldozers and more from trusted sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(barlow.variable, barlowCondensed.variable)}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
