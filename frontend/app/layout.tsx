import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { buildMetadata, buildOrganizationSchema, buildWebsiteSchema } from "@/lib/seo";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = buildMetadata({
  title: "Heavy Construction Equipment Marketplace",
  description:
    "Buy and sell heavy construction equipment with confidence. Road rollers, excavators, cranes, bulldozers and more from trusted sellers.",
  path: "/",
  keywords: ["used excavators", "road rollers", "heavy machinery"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(barlow.variable, barlowCondensed.variable)}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildOrganizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildWebsiteSchema("/")),
          }}
        />
      </body>
    </html>
  );
}
